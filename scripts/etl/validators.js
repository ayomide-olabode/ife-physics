'use strict';

function formatDateTimeForMySql(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
}

function normalizeDateLike(value, table, column, normalization) {
  if (value === null || value === undefined) {
    return { ok: true, value: null };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return {
        ok: false,
        reason: 'invalid_datetime',
        details: { table, column, rawValue: value },
      };
    }

    normalization.datetimeNormalized += 1;
    normalization.datetimeByColumn[`${table}.${column}`] =
      (normalization.datetimeByColumn[`${table}.${column}`] || 0) + 1;

    return { ok: true, value: formatDateTimeForMySql(value) };
  }

  if (typeof value === 'string') {
    const hasExplicitTimezone = /[Tt].*(Z|[+-]\d{2}:\d{2})$/.test(value);
    if (hasExplicitTimezone) {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return {
          ok: false,
          reason: 'invalid_datetime',
          details: { table, column, rawValue: value },
        };
      }

      normalization.datetimeNormalized += 1;
      normalization.datetimeByColumn[`${table}.${column}`] =
        (normalization.datetimeByColumn[`${table}.${column}`] || 0) + 1;

      return { ok: true, value: formatDateTimeForMySql(parsed) };
    }
  }

  return { ok: true, value };
}

function normalizeJsonField(value, table, column, normalization) {
  if (value === null || value === undefined) return { ok: true, value: null };

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      normalization.jsonNormalized += 1;
      normalization.jsonByColumn[`${table}.${column}`] =
        (normalization.jsonByColumn[`${table}.${column}`] || 0) + 1;
      return { ok: true, value: JSON.stringify(parsed) };
    } catch {
      return {
        ok: false,
        reason: 'invalid_json',
        details: { table, column, rawValue: value },
      };
    }
  }

  if (typeof value === 'object') {
    try {
      const normalized = JSON.stringify(value);
      normalization.jsonNormalized += 1;
      normalization.jsonByColumn[`${table}.${column}`] =
        (normalization.jsonByColumn[`${table}.${column}`] || 0) + 1;
      return { ok: true, value: normalized };
    } catch {
      return {
        ok: false,
        reason: 'invalid_json',
        details: { table, column, rawValue: value },
      };
    }
  }

  return {
    ok: false,
    reason: 'invalid_json_type',
    details: { table, column, rawValue: value },
  };
}

function normalizeRow(table, row, options) {
  const { jsonFieldsByTable, normalization } = options;
  const jsonFields = new Set(jsonFieldsByTable[table] || []);

  const transformed = {};
  for (const [column, value] of Object.entries(row)) {
    if (jsonFields.has(column)) {
      const jsonResult = normalizeJsonField(value, table, column, normalization);
      if (!jsonResult.ok) return jsonResult;
      transformed[column] = jsonResult.value;
      continue;
    }

    const dateResult = normalizeDateLike(value, table, column, normalization);
    if (!dateResult.ok) return dateResult;
    transformed[column] = dateResult.value;
  }

  return { ok: true, value: transformed };
}

function keyFromFields(row, fields, options = {}) {
  const { caseInsensitive = false, includeNull = true } = options;
  const values = [];

  for (const field of fields) {
    const raw = row[field];
    if (raw === undefined || raw === null || raw === '') {
      if (!includeNull) return null;
      values.push('__NULL__');
      continue;
    }

    let value = String(raw);
    if (caseInsensitive) value = value.toLowerCase();
    values.push(value);
  }

  return values.join('|');
}

function serializeError(error) {
  if (!error) return { message: 'unknown_error' };
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };
}

module.exports = {
  keyFromFields,
  normalizeRow,
  serializeError,
};
