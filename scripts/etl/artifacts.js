'use strict';

const fs = require('fs/promises');
const path = require('path');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function filePath(runDirs, relativePath) {
  return path.join(runDirs.runDir, relativePath);
}

async function createArtifacts(config) {
  const runDir = path.join(config.artifactRoot, config.runId);
  const runDirs = {
    runDir,
    extractsDir: path.join(runDir, 'extracts'),
    reportsDir: path.join(runDir, 'reports'),
    rejectsDir: path.join(runDir, 'reports', 'rejects'),
    logsDir: path.join(runDir, 'logs'),
  };

  await ensureDir(config.artifactRoot);
  await ensureDir(runDirs.runDir);
  await ensureDir(runDirs.extractsDir);
  await ensureDir(runDirs.reportsDir);
  await ensureDir(runDirs.rejectsDir);
  await ensureDir(runDirs.logsDir);

  async function writeJson(relativePath, payload) {
    const destination = filePath(runDirs, relativePath);
    await ensureDir(path.dirname(destination));
    await fs.writeFile(destination, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  }

  async function appendNdjson(relativePath, payload) {
    const destination = filePath(runDirs, relativePath);
    await ensureDir(path.dirname(destination));
    await fs.appendFile(destination, JSON.stringify(payload) + '\n', 'utf8');
  }

  async function writeText(relativePath, text) {
    const destination = filePath(runDirs, relativePath);
    await ensureDir(path.dirname(destination));
    await fs.writeFile(destination, text, 'utf8');
  }

  async function appendText(relativePath, text) {
    const destination = filePath(runDirs, relativePath);
    await ensureDir(path.dirname(destination));
    await fs.appendFile(destination, text, 'utf8');
  }

  return {
    ...runDirs,
    appendNdjson,
    appendText,
    writeJson,
    writeText,
  };
}

module.exports = {
  createArtifacts,
};
