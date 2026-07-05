const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const rootDir = process.cwd();
const packageJson = JSON.parse(
  readFileSync(join(rootDir, 'package.json'), 'utf8')
);
const coreShellSource = readFileSync(
  join(rootDir, 'packages', 'core', 'src', 'shell.ts'),
  'utf8'
);
const serviceWorkerSource = readFileSync(
  join(rootDir, 'public', 'sw.js'),
  'utf8'
);

const coreFullTitleMatch = coreShellSource.match(/fullTitle: '([^']+)'/);
const coreVersionMatch = coreShellSource.match(/version: '([^']+)'/);

if (coreFullTitleMatch?.[1] !== 'Valgaron World Codex') {
  throw new Error('APP_NAME must be "Valgaron World Codex".');
}

if (!coreVersionMatch) {
  throw new Error('APP_VERSION was not found in core shell metadata.');
}

if (coreVersionMatch[1] !== packageJson.version) {
  throw new Error(
    `APP_VERSION ${coreVersionMatch[1]} does not match package.json ${packageJson.version}.`
  );
}

if (
  !serviceWorkerSource.includes(`valgaron-world-codex-v${packageJson.version}`)
) {
  throw new Error(
    `Service worker cache version must include package version ${packageJson.version}.`
  );
}

process.stdout.write('App metadata check passed.\n');
