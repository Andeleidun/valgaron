const { createHash } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(process.cwd(), 'dist');
const indexPath = join(distDir, 'index.html');
const serviceWorkerPath = join(distDir, 'sw.js');
const deploymentPath = join(distDir, 'deployment.json');
const versionPlaceholder = '__VALGARON_DEPLOY_VERSION__';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (!existsSync(indexPath) || !existsSync(serviceWorkerPath)) {
  fail('dist/index.html and dist/sw.js are required before PWA preparation.');
}

const indexHtml = readFileSync(indexPath, 'utf8');
const serviceWorkerTemplate = readFileSync(serviceWorkerPath, 'utf8');

if (!serviceWorkerTemplate.includes(versionPlaceholder)) {
  fail('dist/sw.js is missing the deployment version placeholder.');
}

const indexSha256 = createHash('sha256').update(indexHtml).digest('hex');
const fallbackVersion = indexSha256.slice(0, 16);
const deployVersion =
  process.env.VITE_DEPLOY_VERSION?.trim() || fallbackVersion;
const deployCommit = process.env.VALGARON_DEPLOY_COMMIT?.trim() || null;

if (!/^[a-zA-Z0-9._-]{1,64}$/.test(deployVersion)) {
  fail('VITE_DEPLOY_VERSION must use 1-64 URL-safe characters.');
}
if (deployCommit && !/^[a-fA-F0-9]{7,64}$/.test(deployCommit)) {
  fail('VALGARON_DEPLOY_COMMIT must be a 7-64 character commit hash.');
}

writeFileSync(
  serviceWorkerPath,
  serviceWorkerTemplate.replaceAll(versionPlaceholder, deployVersion)
);
writeFileSync(
  deploymentPath,
  `${JSON.stringify(
    {
      version: deployVersion,
      commit: deployCommit,
      indexSha256,
    },
    null,
    2
  )}\n`
);

process.stdout.write(
  `Prepared service worker cache version: ${deployVersion}\n`
);
