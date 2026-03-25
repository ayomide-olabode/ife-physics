'use strict';

const path = require('path');

function toBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

function toInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const body = arg.slice(2);
    if (!body) continue;
    const [key, rawValue] = body.split('=');
    if (rawValue === undefined) {
      parsed[key] = true;
    } else {
      parsed[key] = rawValue;
    }
  }
  return parsed;
}

function createRunId() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `run_${stamp}`;
}

function loadConfig(argv) {
  const args = parseArgs(argv);

  const sourcePgUrl = args.sourcePgUrl || process.env.ETL_SOURCE_PG_URL;
  const targetMysqlUrl = args.targetMysqlUrl || process.env.ETL_TARGET_MYSQL_URL || process.env.DATABASE_URL;

  if (args.help || args.h) {
    return { help: true };
  }

  if (!sourcePgUrl) {
    throw new Error('Missing source PostgreSQL URL. Set ETL_SOURCE_PG_URL or pass --sourcePgUrl=...');
  }

  if (!targetMysqlUrl) {
    throw new Error('Missing target MySQL URL. Set ETL_TARGET_MYSQL_URL (or DATABASE_URL) or pass --targetMysqlUrl=...');
  }

  const dryRun = toBool(args.dryRun ?? process.env.ETL_DRY_RUN, true);
  const failOnRejects = toBool(args.failOnRejects ?? process.env.ETL_FAIL_ON_REJECTS, true);
  const requireEmptyTarget = toBool(args.requireEmptyTarget ?? process.env.ETL_REQUIRE_EMPTY_TARGET, true);
  const batchSize = toInt(args.batchSize ?? process.env.ETL_BATCH_SIZE, 500);

  const sourceSchema = args.sourceSchema || process.env.ETL_SOURCE_SCHEMA || 'public';
  const artifactRoot = path.resolve(args.artifactDir || process.env.ETL_ARTIFACT_DIR || 'artifacts/etl');
  const runId = args.runId || createRunId();

  return {
    artifactRoot,
    batchSize,
    dryRun,
    failOnRejects,
    requireEmptyTarget,
    runId,
    sourcePgUrl,
    sourceSchema,
    startTable: args.startTable || process.env.ETL_START_TABLE || null,
    targetMysqlUrl,
  };
}

function printHelp() {
  const lines = [
    'ETL rehearsal runner (PostgreSQL -> MySQL)',
    '',
    'Usage:',
    '  node scripts/etl/rehearsal.js [options]',
    '',
    'Options:',
    '  --sourcePgUrl=...         Source PostgreSQL URL (or ETL_SOURCE_PG_URL)',
    '  --targetMysqlUrl=...      Target MySQL URL (or ETL_TARGET_MYSQL_URL / DATABASE_URL)',
    '  --sourceSchema=public     Source schema (default: public)',
    '  --batchSize=500           Extraction/load batch size',
    '  --dryRun=true|false       Default true; when true, no target inserts/updates occur',
    '  --failOnRejects=true|false Default true; fail loudly if any rejects are found',
    '  --requireEmptyTarget=true|false Default true; enforce empty target tables',
    '  --artifactDir=artifacts/etl Artifact root directory',
    '  --runId=...               Optional explicit run id for replayability',
    '  --startTable=...          Optional table to start from in ordered plan',
    '  --help                    Show this help',
  ];
  return lines.join('\n');
}

module.exports = {
  loadConfig,
  printHelp,
  toBool,
  toInt,
};
