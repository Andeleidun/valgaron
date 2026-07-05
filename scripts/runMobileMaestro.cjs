#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const target = process.argv[2] ?? 'android';

if (target !== 'android') {
  console.error(
    `Unsupported mobile E2E target "${target}". Android is the only Maestro target wired for now.`
  );
  process.exit(1);
}

const shell = process.platform === 'win32';

function getMaestroCommand() {
  if (process.env.MAESTRO_CLI) {
    return process.env.MAESTRO_CLI;
  }
  const pathCommand = findCommandOnPath('maestro');
  if (pathCommand) {
    return pathCommand;
  }
  if (process.platform === 'win32') {
    const documentedWindowsInstall = 'C:\\maestro\\maestro\\bin\\maestro.bat';
    if (fs.existsSync(documentedWindowsInstall)) {
      return documentedWindowsInstall;
    }
  }
  return 'maestro';
}

function findCommandOnPath(commandName) {
  const pathValue = process.env.PATH || process.env.Path || '';
  const extensions =
    process.platform === 'win32'
      ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
      : [''];
  for (const directory of pathValue.split(path.delimiter)) {
    if (!directory) {
      continue;
    }
    for (const extension of extensions) {
      const candidate = path.join(directory, `${commandName}${extension}`);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

const maestroCommand = getMaestroCommand();
const versionResult = spawnSync(maestroCommand, ['--version'], {
  encoding: 'utf8',
  shell,
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (versionResult.error || versionResult.status !== 0) {
  console.error('Maestro CLI is required for mobile E2E tests.');
  console.error(
    'Install Maestro, confirm it is on PATH, or set MAESTRO_CLI to the executable path.'
  );
  if (versionResult.stderr) {
    console.error(versionResult.stderr.trim());
  }
  process.exit(versionResult.status ?? 1);
}

const version = `${versionResult.stdout}${versionResult.stderr}`.trim();
if (version) {
  console.log(`Using Maestro ${version}`);
}

const flowPath = path.join('mobile', 'e2e', 'flows', 'character-tree.yaml');
const testResult = spawnSync(maestroCommand, ['test', flowPath], {
  shell,
  stdio: 'inherit',
});

process.exit(testResult.status ?? 1);
