const { createHash } = require('node:crypto');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(process.cwd(), 'dist');
const requiredFiles = [
  'index.html',
  '404.html',
  'manifest.webmanifest',
  'sw.js',
  'deployment.json',
  'favicon.svg',
  'pwa-icon-192.png',
  'pwa-icon-512.png',
];

function assert(condition, message) {
  if (!condition) {
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

for (const file of requiredFiles) {
  const filePath = join(distDir, file);
  assert(existsSync(filePath), `Missing build file: dist/${file}`);
  assert(statSync(filePath).size > 0, `Empty build file: dist/${file}`);
}

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
const fallbackHtml = readFileSync(join(distDir, '404.html'), 'utf8');
const manifest = JSON.parse(
  readFileSync(join(distDir, 'manifest.webmanifest'), 'utf8')
);
const serviceWorker = readFileSync(join(distDir, 'sw.js'), 'utf8');
const deployment = JSON.parse(
  readFileSync(join(distDir, 'deployment.json'), 'utf8')
);
const expectedThemeColor = '#111312';

assert(
  indexHtml.includes('rel="manifest"') &&
    indexHtml.includes('manifest.webmanifest'),
  'index.html does not link the web app manifest.'
);
assert(
  indexHtml.includes('theme-color'),
  'index.html does not include a theme-color meta tag.'
);
assert(
  indexHtml.includes(`name="theme-color" content="${expectedThemeColor}"`),
  'index.html theme-color must match the app dark theme.'
);
assert(
  fallbackHtml === indexHtml,
  'dist/404.html must match dist/index.html for GitHub Pages route fallback.'
);
assert(manifest.name === 'Valgaron World Codex', 'Manifest name is incorrect.');
assert(
  manifest.display === 'standalone',
  'Manifest display mode must be standalone.'
);
assert(
  manifest.theme_color === expectedThemeColor &&
    manifest.background_color === expectedThemeColor,
  'Manifest theme and background colors must match the app dark theme.'
);
assert(
  Array.isArray(manifest.icons) && manifest.icons.length >= 3,
  'Manifest must include favicon and install icons.'
);
assert(
  serviceWorker.includes('networkFirst') &&
    serviceWorker.includes('VALGARON_CACHE_VERSION'),
  'Service worker cache strategy markers are missing.'
);
assert(
  typeof deployment.version === 'string' && deployment.version.length > 0,
  'deployment.json version is missing.'
);
assert(
  deployment.indexSha256 ===
    createHash('sha256').update(indexHtml).digest('hex'),
  'deployment.json index hash does not match index.html.'
);
assert(
  serviceWorker.includes(
    `const VALGARON_DEPLOY_VERSION = '${deployment.version}';`
  ),
  'Service worker deploy version does not match deployment.json.'
);
assert(
  !process.env.VALGARON_DEPLOY_COMMIT ||
    deployment.commit === process.env.VALGARON_DEPLOY_COMMIT,
  'deployment.json commit does not match VALGARON_DEPLOY_COMMIT.'
);
assert(
  !process.env.VALGARON_DEPLOY_COMMIT ||
    deployment.version === process.env.VALGARON_DEPLOY_COMMIT,
  'deployment.json version does not match VALGARON_DEPLOY_COMMIT.'
);

process.stdout.write('PWA build verification passed.\n');
