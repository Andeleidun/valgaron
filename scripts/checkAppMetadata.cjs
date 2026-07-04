const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const rootDir = process.cwd();
const packageJson = JSON.parse(
  readFileSync(join(rootDir, 'package.json'), 'utf8')
);
const metadataSource = readFileSync(
  join(rootDir, 'src', 'Utlilities', 'appMetadata.ts'),
  'utf8'
);
const coreShellSource = readFileSync(
  join(rootDir, 'packages', 'core', 'src', 'shell.ts'),
  'utf8'
);
const serviceWorkerSource = readFileSync(
  join(rootDir, 'public', 'sw.js'),
  'utf8'
);

const versionMatch = metadataSource.match(
  /export const APP_VERSION = '([^']+)';/
);
const nameMatch = metadataSource.match(/export const APP_NAME = '([^']+)';/);
const coreFullTitleMatch = coreShellSource.match(/fullTitle: '([^']+)'/);
const appName =
  nameMatch?.[1] ??
  (metadataSource.includes('export const APP_NAME = valgaronProduct.fullTitle;')
    ? coreFullTitleMatch?.[1]
    : undefined);

if (appName !== 'Valgaron World Codex') {
  throw new Error('APP_NAME must be "Valgaron World Codex".');
}

if (!versionMatch) {
  throw new Error('APP_VERSION was not found in appMetadata.ts.');
}

if (versionMatch[1] !== packageJson.version) {
  throw new Error(
    `APP_VERSION ${versionMatch[1]} does not match package.json ${packageJson.version}.`
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
