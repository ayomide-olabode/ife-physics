#!/usr/bin/env node
'use strict';

const path = require('path');

const { createArtifacts } = require('./artifacts');
const { loadConfig, printHelp } = require('./config');
const {
  CASE_UNIQUE_RULES,
  COMPOUND_UNIQUE_RULES,
  DEFERRED_NULL_ON_LOAD,
  DEFERRED_UPDATES,
  FK_RULES,
  JSON_FIELDS,
  ONE_TO_ONE_RULES,
  TABLE_CONFLICT_POLICIES,
  TABLE_ORDER,
  getPrimaryKey,
} = require('./plan');
const {
  connectSourcePg,
  connectTargetMySql,
  fetchSourceBatch,
  getSourceColumns,
  getSourceRowCount,
  getTargetDatabaseName,
  getTargetExactCount,
  getTargetTableNames,
  insertRows,
  pingSourcePg,
  pingTargetMySql,
  updateDeferredField,
} = require('./db');
const { keyFromFields, normalizeRow, serializeError } = require('./validators');

function redactConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '<invalid-url>';
  }
}

function nowIso() {
  return new Date().toISOString();
}

function createNormalizationState() {
  return {
    datetimeByColumn: {},
    datetimeNormalized: 0,
    jsonByColumn: {},
    jsonNormalized: 0,
  };
}

function splitRulesByTable(rules) {
  const byTable = new Map();
  for (const rule of rules) {
    if (!byTable.has(rule.table)) byTable.set(rule.table, []);
    byTable.get(rule.table).push(rule);
  }
  return byTable;
}

async function appendLog(artifacts, message) {
  const line = `[${nowIso()}] ${message}`;
  console.log(line);
  await artifacts.appendText(path.join('logs', 'run.log'), `${line}\n`);
}

async function verifyTargetTables(target, databaseName, expectedTables) {
  const missing = [];

  for (const table of expectedTables) {
    const [rows] = await target.query(
      `
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = ? AND table_name = ?
      `,
      [databaseName, table],
    );

    const exists = Number(rows[0].count) > 0;
    if (!exists) missing.push(table);
  }

  return { missing };
}

async function checkTargetEmptiness(target, expectedTables) {
  const nonEmpty = [];

  for (const table of expectedTables) {
    const count = await getTargetExactCount(target, table);
    if (count > 0) {
      nonEmpty.push({ count, table });
    }
  }

  return nonEmpty;
}

function ensureDeferredNulls(table, row, deferredBuffer) {
  const fields = DEFERRED_NULL_ON_LOAD[table] || [];
  if (!fields.length) return row;

  const clone = { ...row };
  for (const field of fields) {
    if (clone[field] !== null && clone[field] !== undefined) {
      deferredBuffer.push({
        field,
        id: clone.id,
        table,
        value: clone[field],
      });
      clone[field] = null;
    }
  }
  return clone;
}

function buildTrackerMap(rules, table) {
  const trackers = [];
  for (const rule of rules) {
    if (rule.table !== table) continue;
    trackers.push({
      rule,
      seen: new Map(),
    });
  }
  return trackers;
}

function checkDuplicateTrackers(row, trackers, options = {}) {
  const issues = [];

  for (const tracker of trackers) {
    const key = keyFromFields(row, tracker.rule.fields, options);
    if (key === null) continue;

    if (!tracker.seen.has(key)) {
      tracker.seen.set(key, row.id || null);
      continue;
    }

    issues.push({
      reason: 'duplicate_key',
      rule: tracker.rule.name,
      fields: tracker.rule.fields,
      key,
      priorRowId: tracker.seen.get(key),
      rowId: row.id || null,
    });
  }

  return issues;
}

function checkFkOrphans(table, row, fkRulesByTable, keySetsByTable) {
  const issues = [];
  const tableRules = fkRulesByTable.get(table) || [];

  for (const rule of tableRules) {
    if (rule.deferred) continue;

    const value = row[rule.field];
    if (value === null || value === undefined || value === '') continue;

    const parentKeys = keySetsByTable.get(rule.referencesTable);
    if (!parentKeys) {
      issues.push({
        reason: 'fk_parent_not_loaded',
        table,
        field: rule.field,
        referencesTable: rule.referencesTable,
        value,
      });
      continue;
    }

    const parentLookup = keyFromFields({ [rule.referencesField]: value }, [rule.referencesField], {
      includeNull: true,
    });

    if (!parentKeys.has(parentLookup)) {
      issues.push({
        reason: 'fk_orphan',
        table,
        field: rule.field,
        referencesField: rule.referencesField,
        referencesTable: rule.referencesTable,
        value,
      });
    }
  }

  return issues;
}

function createRejectEntry(table, rowIndex, row, issues) {
  return {
    issues,
    row,
    rowIndex,
    table,
  };
}

function isNullish(value) {
  return value === null || value === undefined || value === '';
}

function toSortableMillis(value) {
  if (isNullish(value)) return Number.NEGATIVE_INFINITY;
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return Number.NEGATIVE_INFINITY;

    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(trimmed);
    const asIso = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed;
    const candidate = hasTimezone ? asIso : `${asIso}Z`;
    const parsed = Date.parse(candidate);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  }

  return Number.NEGATIVE_INFINITY;
}

function compareRoleAssignmentRows(left, right) {
  const leftActive = isNullish(left.deletedAt);
  const rightActive = isNullish(right.deletedAt);
  if (leftActive !== rightActive) return leftActive ? 1 : -1;

  const leftUpdated = toSortableMillis(left.updatedAt);
  const rightUpdated = toSortableMillis(right.updatedAt);
  if (leftUpdated !== rightUpdated) return leftUpdated > rightUpdated ? 1 : -1;

  const leftCreated = toSortableMillis(left.createdAt);
  const rightCreated = toSortableMillis(right.createdAt);
  if (leftCreated !== rightCreated) return leftCreated > rightCreated ? 1 : -1;

  const leftId = String(left.id || '');
  const rightId = String(right.id || '');
  if (leftId === rightId) return 0;
  return leftId < rightId ? 1 : -1;
}

function roleAssignmentDecisionReason(winner, loser) {
  const winnerActive = isNullish(winner.deletedAt);
  const loserActive = isNullish(loser.deletedAt);
  if (winnerActive !== loserActive) {
    return winnerActive
      ? 'preferred_non_soft_deleted_over_soft_deleted'
      : 'preferred_soft_deleted_over_non_soft_deleted';
  }

  const winnerUpdated = toSortableMillis(winner.updatedAt);
  const loserUpdated = toSortableMillis(loser.updatedAt);
  if (winnerUpdated !== loserUpdated) return 'preferred_latest_updatedAt';

  const winnerCreated = toSortableMillis(winner.createdAt);
  const loserCreated = toSortableMillis(loser.createdAt);
  if (winnerCreated !== loserCreated) return 'preferred_latest_createdAt';

  return 'preferred_lexicographically_smallest_id_tiebreaker';
}

function resolveRoleAssignmentConflicts(rows, policy) {
  const groups = new Map();

  for (const row of rows) {
    const key = keyFromFields(row, policy.conflictKeyFields, { includeNull: true });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const winners = [];
  const quarantined = [];
  const conflicts = [];

  for (const [conflictKey, groupRows] of groups.entries()) {
    if (groupRows.length === 1) {
      winners.push(groupRows[0]);
      continue;
    }

    const ordered = [...groupRows].sort((left, right) => {
      const rank = compareRoleAssignmentRows(left, right);
      if (rank === 0) return 0;
      return rank > 0 ? -1 : 1;
    });

    const winner = ordered[0];
    winners.push(winner);

    const loserEntries = [];
    for (const loser of ordered.slice(1)) {
      const reason = roleAssignmentDecisionReason(winner, loser);
      const loserEntry = {
        conflictKey,
        keyFields: policy.conflictKeyFields,
        loserRow: loser,
        policy: policy.name,
        reason,
        table: policy.table,
        winnerId: winner.id || null,
      };
      quarantined.push(loserEntry);
      loserEntries.push({
        id: loser.id || null,
        createdAt: loser.createdAt || null,
        deletedAt: loser.deletedAt || null,
        reason,
        updatedAt: loser.updatedAt || null,
      });
    }

    conflicts.push({
      conflictKey,
      keyFields: policy.conflictKeyFields,
      policy: policy.name,
      table: policy.table,
      totalRows: groupRows.length,
      winner: {
        createdAt: winner.createdAt || null,
        deletedAt: winner.deletedAt || null,
        id: winner.id || null,
        updatedAt: winner.updatedAt || null,
      },
      losers: loserEntries,
    });
  }

  return {
    conflicts,
    quarantined,
    winners,
  };
}

async function run() {
  const config = loadConfig(process.argv.slice(2));
  if (config.help) {
    console.log(printHelp());
    return;
  }

  const artifacts = await createArtifacts(config);

  await artifacts.writeJson('run-config.json', {
    artifactRoot: config.artifactRoot,
    batchSize: config.batchSize,
    dryRun: config.dryRun,
    failOnRejects: config.failOnRejects,
    requireEmptyTarget: config.requireEmptyTarget,
    runId: config.runId,
    sourcePgUrl: redactConnectionString(config.sourcePgUrl),
    sourceSchema: config.sourceSchema,
    startTable: config.startTable,
    targetMysqlUrl: redactConnectionString(config.targetMysqlUrl),
  });

  const fkRulesByTable = splitRulesByTable(FK_RULES);
  const caseRulesByTable = splitRulesByTable(CASE_UNIQUE_RULES);
  const oneToOneByTable = splitRulesByTable(ONE_TO_ONE_RULES);
  const compoundByTable = splitRulesByTable(COMPOUND_UNIQUE_RULES);

  const runSummary = {
    endedAt: null,
    failures: [],
    postLoadValidation: {},
    startedAt: nowIso(),
    tableSummaries: [],
  };

  let source = null;
  let target = null;

  try {
    await appendLog(artifacts, `Run started. runId=${config.runId}`);

    source = await connectSourcePg(config.sourcePgUrl);
    target = await connectTargetMySql(config.targetMysqlUrl);

    await pingSourcePg(source);
    await pingTargetMySql(target);

    const databaseName = await getTargetDatabaseName(target);
    await appendLog(artifacts, `Connected to source PostgreSQL and target MySQL database '${databaseName}'.`);

    const startIndex = config.startTable ? TABLE_ORDER.indexOf(config.startTable) : 0;
    if (startIndex === -1) {
      throw new Error(`Invalid start table '${config.startTable}'. It was not found in the approved table order.`);
    }

    if (startIndex > 0) {
      throw new Error(
        `startTable replay from mid-plan is not supported safely yet. Use full ordered rehearsal from '${TABLE_ORDER[0]}'.`,
      );
    }
    const tablesToProcess = TABLE_ORDER.slice(startIndex);

    const targetCheck = await verifyTargetTables(target, databaseName, TABLE_ORDER);
    if (targetCheck.missing.length) {
      throw new Error(`Target schema missing expected tables: ${targetCheck.missing.join(', ')}`);
    }
    const knownTargetTables = await getTargetTableNames(target, databaseName);
    const allowedNonDomainTables = new Set(['_prisma_migrations']);
    const unplannedTables = knownTargetTables.filter(
      (table) => !TABLE_ORDER.includes(table) && !allowedNonDomainTables.has(table),
    );
    if (unplannedTables.length) {
      throw new Error(
        `Target has table(s) not covered by ETL plan: ${unplannedTables.join(', ')}. Update scripts/etl/plan.js before rehearsal.`,
      );
    }

    if (config.requireEmptyTarget) {
      const nonEmpty = await checkTargetEmptiness(target, TABLE_ORDER);
      if (nonEmpty.length) {
        throw new Error(
          `Target is not empty for rehearsal-safe load. Non-empty tables: ${nonEmpty
            .map((item) => `${item.table}(${item.count})`)
            .join(', ')}`,
        );
      }
    }

    const sourceCounts = {};
    for (const table of TABLE_ORDER) {
      sourceCounts[table] = await getSourceRowCount(source, config.sourceSchema, table);
    }
    await artifacts.writeJson(path.join('reports', 'source-counts.json'), sourceCounts);

    const keySetsByTable = new Map();
    const normalization = createNormalizationState();
    const caseCollisionReport = [];
    const deferredRows = [];

    for (const table of tablesToProcess) {
      await appendLog(artifacts, `Processing table ${table}...`);

      const columns = await getSourceColumns(source, config.sourceSchema, table);
      if (!columns.length) {
        throw new Error(`No source columns found for table ${table}.`);
      }

      const tableConflictPolicy = TABLE_CONFLICT_POLICIES[table] || null;
      const tableCaseTrackers = buildTrackerMap(caseRulesByTable.get(table) || [], table);
      const tableOneToOneTrackers = buildTrackerMap(oneToOneByTable.get(table) || [], table);
      const tableCompoundRules = (compoundByTable.get(table) || []).filter(
        (rule) => !(tableConflictPolicy && rule.name === tableConflictPolicy.ruleName),
      );
      const tableCompoundTrackers = buildTrackerMap(tableCompoundRules, table);

      let offset = 0;
      let sourceRowIndex = 0;
      const rejects = [];
      const candidateRows = [];

      while (true) {
        const batch = await fetchSourceBatch(source, {
          batchSize: config.batchSize,
          columns,
          offset,
          orderByFields: getPrimaryKey(table),
          schema: config.sourceSchema,
          table,
        });

        if (!batch.length) break;
        offset += batch.length;

        for (const sourceRow of batch) {
          sourceRowIndex += 1;
          await artifacts.appendNdjson(path.join('extracts', `${table}.ndjson`), sourceRow);

          const withDeferredNulls = ensureDeferredNulls(table, sourceRow, deferredRows);

          const normalized = normalizeRow(table, withDeferredNulls, {
            jsonFieldsByTable: JSON_FIELDS,
            normalization,
          });

          if (!normalized.ok) {
            rejects.push(
              createRejectEntry(table, sourceRowIndex, sourceRow, [
                {
                  details: normalized.details,
                  reason: normalized.reason,
                },
              ]),
            );
            continue;
          }

          const row = normalized.value;
          const issues = [];

          const caseIssues = checkDuplicateTrackers(row, tableCaseTrackers, {
            caseInsensitive: true,
            includeNull: false,
          });
          if (caseIssues.length) {
            issues.push(...caseIssues);
            for (const caseIssue of caseIssues) {
              caseCollisionReport.push({ table, ...caseIssue });
            }
          }

          issues.push(
            ...checkDuplicateTrackers(row, tableOneToOneTrackers, {
              caseInsensitive: false,
              includeNull: false,
            }),
          );

          issues.push(
            ...checkDuplicateTrackers(row, tableCompoundTrackers, {
              caseInsensitive: false,
              includeNull: true,
            }),
          );

          issues.push(...checkFkOrphans(table, row, fkRulesByTable, keySetsByTable));

          if (issues.length) {
            rejects.push(createRejectEntry(table, sourceRowIndex, sourceRow, issues));
            continue;
          }

          candidateRows.push(row);
        }
      }

      if (rejects.length) {
        for (const reject of rejects) {
          await artifacts.appendNdjson(path.join('reports', 'rejects', `${table}.ndjson`), reject);
        }

        await appendLog(artifacts, `Table ${table} produced ${rejects.length} reject(s).`);

        if (config.failOnRejects) {
          throw new Error(`Rejects found for table ${table} and failOnRejects=true. See reports/rejects/${table}.ndjson`);
        }
      }

      let validRows = candidateRows;
      let quarantinedRows = [];

      if (tableConflictPolicy && tableConflictPolicy.table === 'RoleAssignment' && candidateRows.length) {
        const conflictResolution = resolveRoleAssignmentConflicts(candidateRows, tableConflictPolicy);
        validRows = conflictResolution.winners;
        quarantinedRows = conflictResolution.quarantined;

        if (conflictResolution.conflicts.length) {
          await artifacts.writeJson(path.join('reports', `${table}.conflict-resolution.json`), {
            conflictGroups: conflictResolution.conflicts,
            distinctKeyCount: conflictResolution.winners.length,
            policy: tableConflictPolicy.name,
            sourceCandidateRows: candidateRows.length,
            table,
            totalConflictGroups: conflictResolution.conflicts.length,
            winnersRetained: conflictResolution.winners.length,
          });

          for (const quarantined of quarantinedRows) {
            await artifacts.appendNdjson(path.join('reports', 'quarantine', `${table}.ndjson`), quarantined);
          }

          await appendLog(
            artifacts,
            `Table ${table} conflict policy applied. winners=${validRows.length}, quarantined=${quarantinedRows.length}.`,
          );
        }
      }

      if (!config.dryRun && validRows.length) {
        for (let index = 0; index < validRows.length; index += config.batchSize) {
          const loadBatch = validRows.slice(index, index + config.batchSize);
          await insertRows(target, table, columns, loadBatch);
        }
      }

      const keySet = new Set();
      const pkFields = getPrimaryKey(table);
      for (const row of validRows) {
        keySet.add(keyFromFields(row, pkFields, { includeNull: true }));
      }
      keySetsByTable.set(table, keySet);

      const summary = {
        loadedRows: config.dryRun ? 0 : validRows.length,
        preConflictValidRows: candidateRows.length,
        quarantinedRows: quarantinedRows.length,
        rejects: rejects.length,
        sourceRows: sourceRowIndex,
        table,
        validRows: validRows.length,
      };
      runSummary.tableSummaries.push(summary);

      await artifacts.writeJson(path.join('reports', `${table}.summary.json`), summary);
      await appendLog(
        artifacts,
        `Table ${table} done. source=${sourceRowIndex}, valid=${validRows.length}, quarantined=${quarantinedRows.length}, rejects=${rejects.length}, loaded=${summary.loadedRows}`,
      );
    }

    const deferredRejects = [];

    for (const deferredSpec of DEFERRED_UPDATES) {
      const updates = deferredRows
        .filter((item) => item.table === deferredSpec.table && item.field === deferredSpec.field)
        .map((item) => ({ id: item.id, value: item.value }));

      if (!updates.length) continue;

      const refKeySet = keySetsByTable.get(deferredSpec.referencesTable) || new Set();
      const verifiedUpdates = [];

      for (const update of updates) {
        const lookupKey = keyFromFields(
          { [deferredSpec.referencesField]: update.value },
          [deferredSpec.referencesField],
          { includeNull: true },
        );

        if (!refKeySet.has(lookupKey)) {
          deferredRejects.push({
            deferredRule: deferredSpec.name,
            id: update.id,
            missingReference: update.value,
            referencesTable: deferredSpec.referencesTable,
            table: deferredSpec.table,
          });
          continue;
        }

        verifiedUpdates.push(update);
      }

      await artifacts.writeJson(path.join('reports', `${deferredSpec.name}.planned-updates.json`), {
        totalDeferredRows: updates.length,
        verifiedUpdates: verifiedUpdates.length,
      });

      if (deferredRejects.length && config.failOnRejects) {
        for (const reject of deferredRejects) {
          await artifacts.appendNdjson(path.join('reports', 'rejects', `${deferredSpec.name}.ndjson`), reject);
        }

        throw new Error(
          `Deferred update '${deferredSpec.name}' has missing references and failOnRejects=true. See reports/rejects/${deferredSpec.name}.ndjson`,
        );
      }

      if (!config.dryRun) {
        await updateDeferredField(target, {
          field: deferredSpec.field,
          idField: deferredSpec.idField,
          table: deferredSpec.table,
          updates: verifiedUpdates,
        });
      }

      await appendLog(
        artifacts,
        `Deferred update ${deferredSpec.name} done. verified=${verifiedUpdates.length}, rejects=${deferredRejects.length}.`,
      );
    }

    await artifacts.writeJson(path.join('reports', 'case-collision-report.json'), caseCollisionReport);
    await artifacts.writeJson(path.join('reports', 'normalization-report.json'), normalization);

    const postLoadCounts = {};
    const countMismatches = [];
    const summaryByTable = new Map(runSummary.tableSummaries.map((summary) => [summary.table, summary]));

    if (!config.dryRun) {
      for (const table of TABLE_ORDER) {
        const targetCount = await getTargetExactCount(target, table);
        const sourceCount = Number(sourceCounts[table] || 0);
        const summary = summaryByTable.get(table);
        const expectedTargetCount = summary ? Number(summary.validRows || 0) : sourceCount;
        const quarantinedRows = summary ? Number(summary.quarantinedRows || 0) : 0;
        const rejects = summary ? Number(summary.rejects || 0) : 0;
        postLoadCounts[table] = { expectedTargetCount, quarantinedRows, rejects, sourceCount, targetCount };

        if (expectedTargetCount !== targetCount) {
          countMismatches.push({ expectedTargetCount, sourceCount, table, targetCount });
        }
      }

      await artifacts.writeJson(path.join('reports', 'post-load-counts.json'), postLoadCounts);

      if (countMismatches.length && config.failOnRejects) {
        throw new Error(
          `Post-load count mismatches detected: ${countMismatches
            .map(
              (item) =>
                `${item.table}(expected=${item.expectedTargetCount},source=${item.sourceCount},target=${item.targetCount})`,
            )
            .join(', ')}`,
        );
      }
    }

    runSummary.postLoadValidation = {
      countMismatches,
      dryRun: config.dryRun,
      normalization,
      quarantinedByTable: runSummary.tableSummaries
        .filter((summary) => Number(summary.quarantinedRows || 0) > 0)
        .map((summary) => ({ quarantinedRows: summary.quarantinedRows, table: summary.table })),
    };

    runSummary.endedAt = nowIso();
    await artifacts.writeJson('run-summary.json', runSummary);
    await appendLog(artifacts, 'Run completed successfully.');
  } catch (error) {
    runSummary.endedAt = nowIso();
    runSummary.failures.push(serializeError(error));

    if (artifacts) {
      await artifacts.writeJson('run-summary.json', runSummary);
      await appendLog(artifacts, `Run failed: ${error.message}`);
    }

    throw error;
  } finally {
    if (source) {
      await source.end().catch(() => undefined);
    }
    if (target) {
      await target.end().catch(() => undefined);
    }
  }
}

run().catch((error) => {
  console.error(`ETL rehearsal failed: ${error.message}`);
  process.exitCode = 1;
});
