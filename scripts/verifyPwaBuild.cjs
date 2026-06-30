const { existsSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');

const distDir = join(process.cwd(), 'dist');
const requiredFiles = [
  'index.html',
  '404.html',
  'manifest.webmanifest',
  'sw.js',
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
  fallbackHtml === indexHtml,
  'dist/404.html must match dist/index.html for GitHub Pages route fallback.'
);
assert(manifest.name === 'Valgaron World Codex', 'Manifest name is incorrect.');
assert(
  manifest.display === 'standalone',
  'Manifest display mode must be standalone.'
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

process.stdout.write('PWA build verification passed.\n');
