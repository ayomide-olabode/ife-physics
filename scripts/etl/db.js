'use strict';

const { Client: PgClient } = require('pg');
const mysql = require('mysql2/promise');

function quotePgIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function quoteMyIdent(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function connectSourcePg(connectionString) {
  const client = new PgClient({
    application_name: 'etl_rehearsal',
    connectionString,
  });
  await client.connect();
  return client;
}

async function connectTargetMySql(connectionString) {
  const connection = await mysql.createConnection({
    timezone: 'Z',
    uri: connectionString,
  });
  return connection;
}

async function pingSourcePg(client) {
  await client.query('SELECT 1');
}

async function pingTargetMySql(connection) {
  await connection.query('SELECT 1');
}

async function getSourceColumns(client, schema, table) {
  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `,
    [schema, table],
  );
  return rows.map((row) => row.column_name);
}

async function getSourceRowCount(client, schema, table) {
  const sql = `SELECT COUNT(*)::bigint AS count FROM ${quotePgIdent(schema)}.${quotePgIdent(table)}`;
  const { rows } = await client.query(sql);
  return Number(rows[0].count);
}

async function fetchSourceBatch(client, options) {
  const { batchSize, columns, offset, orderByFields, schema, table } = options;
  const quotedColumns = columns.map((column) => quotePgIdent(column)).join(', ');
  const safeOrderBy = (orderByFields && orderByFields.length ? orderByFields : [columns[0]]).map((column) =>
    quotePgIdent(column),
  );
  const orderBy = safeOrderBy.join(', ');
  const sql = `
    SELECT ${quotedColumns}
    FROM ${quotePgIdent(schema)}.${quotePgIdent(table)}
    ORDER BY ${orderBy}
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await client.query(sql, [batchSize, offset]);
  return rows;
}

function normalizeInsertValue(value) {
  if (value === undefined) return null;
  if (value instanceof Date) return value;
  return value;
}

async function insertRows(connection, table, columns, rows) {
  if (!rows.length) return;
  const columnSql = columns.map((column) => quoteMyIdent(column)).join(', ');
  const rowPlaceholder = `(${columns.map(() => '?').join(', ')})`;
  const valuesSql = rows.map(() => rowPlaceholder).join(', ');
  const sql = `INSERT INTO ${quoteMyIdent(table)} (${columnSql}) VALUES ${valuesSql}`;

  const params = [];
  for (const row of rows) {
    for (const column of columns) {
      params.push(normalizeInsertValue(row[column]));
    }
  }

  await connection.query(sql, params);
}

async function updateDeferredField(connection, update) {
  const { field, idField, table, updates } = update;
  if (!updates.length) return;
  for (const item of updates) {
    const sql = `UPDATE ${quoteMyIdent(table)} SET ${quoteMyIdent(field)} = ? WHERE ${quoteMyIdent(idField)} = ?`;
    await connection.query(sql, [item.value, item.id]);
  }
}

async function getTargetRowCount(connection, databaseName, table) {
  const [rows] = await connection.query(
    `
      SELECT COALESCE(table_rows, 0) AS row_count
      FROM information_schema.tables
      WHERE table_schema = ? AND table_name = ?
      LIMIT 1
    `,
    [databaseName, table],
  );

  if (!rows.length) return null;
  return Number(rows[0].row_count);
}

async function getTargetExactCount(connection, table) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM ${quoteMyIdent(table)}`);
  return Number(rows[0].count);
}

async function getTargetDatabaseName(connection) {
  const [rows] = await connection.query('SELECT DATABASE() AS db_name');
  return rows[0].db_name;
}

async function getTargetTableNames(connection, databaseName) {
  const [rows] = await connection.query(
    `
      SELECT table_name AS tableName
      FROM information_schema.tables
      WHERE table_schema = ?
      ORDER BY table_name
    `,
    [databaseName],
  );
  return rows.map((row) => row.tableName);
}

module.exports = {
  connectSourcePg,
  connectTargetMySql,
  fetchSourceBatch,
  getSourceColumns,
  getSourceRowCount,
  getTargetDatabaseName,
  getTargetExactCount,
  getTargetRowCount,
  getTargetTableNames,
  insertRows,
  pingSourcePg,
  pingTargetMySql,
  quoteMyIdent,
  quotePgIdent,
  updateDeferredField,
};
