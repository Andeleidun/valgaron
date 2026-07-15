const { createHash } = require('node:crypto');

const expectedCommit = process.env.EXPECTED_COMMIT?.trim();
const pagesUrl = process.env.PAGES_URL?.trim();
const maxAttempts = 24;
const retryDelayMs = 5000;
const requestTimeoutMs = 10000;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (!pagesUrl || !expectedCommit) {
  fail('PAGES_URL and EXPECTED_COMMIT are required.');
}
if (!/^[a-fA-F0-9]{7,64}$/.test(expectedCommit)) {
  fail('EXPECTED_COMMIT must be a 7-64 character commit hash.');
}

let pagesBaseUrl;
try {
  pagesBaseUrl = new URL(pagesUrl.endsWith('/') ? pagesUrl : `${pagesUrl}/`);
} catch {
  fail('PAGES_URL must be a valid URL.');
}
if (!['http:', 'https:'].includes(pagesBaseUrl.protocol)) {
  fail('PAGES_URL must use HTTP or HTTPS.');
}

function deploymentUrl(path) {
  const url = new URL(path, pagesBaseUrl);
  url.searchParams.set('deployment', expectedCommit);
  return url;
}

async function fetchText(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(deploymentUrl(path), {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `${path || 'Pages root'} returned HTTP ${response.status}.`
      );
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyDeployment() {
  const deploymentText = await fetchText('deployment.json');
  const deployment = JSON.parse(deploymentText);
  if (deployment.commit !== expectedCommit) {
    throw new Error(
      `deployment.json reports ${
        deployment.commit ?? 'no commit'
      } instead of ${expectedCommit}.`
    );
  }
  if (typeof deployment.version !== 'string' || !deployment.version) {
    throw new Error('deployment.json is missing its version.');
  }
  if (deployment.version !== expectedCommit) {
    throw new Error(
      `deployment.json version ${deployment.version} does not match ${expectedCommit}.`
    );
  }

  const [rootHtml, indexHtml, serviceWorker] = await Promise.all([
    fetchText(''),
    fetchText('index.html'),
    fetchText('sw.js'),
  ]);
  if (!indexHtml.includes('id="root"')) {
    throw new Error('The deployed index.html is not the Valgaron app shell.');
  }
  const indexSha256 = createHash('sha256').update(indexHtml).digest('hex');
  if (deployment.indexSha256 !== indexSha256) {
    throw new Error('The deployed index.html does not match deployment.json.');
  }
  const rootSha256 = createHash('sha256').update(rootHtml).digest('hex');
  if (deployment.indexSha256 !== rootSha256) {
    throw new Error('The deployed Pages root does not match deployment.json.');
  }
  if (
    !serviceWorker.includes(
      `const VALGARON_DEPLOY_VERSION = '${deployment.version}';`
    )
  ) {
    throw new Error(
      'The deployed service worker does not match deployment.json.'
    );
  }
}

async function run() {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await verifyDeployment();
      process.stdout.write(
        `Verified live GitHub Pages deployment for ${expectedCommit}.\n`
      );
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        process.stdout.write(
          `Live deployment not ready (attempt ${attempt}/${maxAttempts}); retrying.\n`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  fail(
    `GitHub Pages did not publish ${expectedCommit}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

run();
