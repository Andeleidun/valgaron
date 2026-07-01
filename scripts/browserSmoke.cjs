const {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} = require('node:fs');
const { get } = require('node:http');
const { basename, join } = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const host = '127.0.0.1';
const port = Number(process.env.VWB_SMOKE_PORT ?? 5373);
const baseUrl = `http://${host}:${port}`;
const rootDir = process.cwd();
const artifactDir = join(rootDir, '.tmp', 'browser-smoke');
const profileRoot = join(
  artifactDir,
  'profiles',
  `run-${process.pid}-${Date.now()}`
);
const screenshotDir = join(artifactDir, 'screenshots');
const serverReadyTimeoutMs = 15000;
const browserTimeoutMs = 30000;

const routeChecks = [
  {
    path: '/',
    expectedText: [
      'Valgaron World Codex',
      'Draft the world',
      'Local browser data',
    ],
  },
  {
    path: '/characters',
    expectedText: ['Characters', 'Search this section', 'Mira Rowan'],
  },
  {
    path: '/relationships',
    expectedText: ['Relationships', 'Relationship editor', 'Graph view'],
  },
  {
    path: '/timeline',
    expectedText: ['Timeline', 'Timeline view', 'Timeline table'],
  },
  {
    path: '/data',
    expectedText: [
      'Data',
      'Manual local save',
      'Active workspace JSON',
      'Full document JSON',
      'Import JSON backup',
    ],
  },
  {
    path: '/workspaces',
    expectedText: [
      'Workspaces',
      'Project/universe workspaces',
      'In-fiction worlds and planets',
      'Custom entry types',
    ],
  },
  {
    path: '/help',
    expectedText: [
      'Help',
      'Backups and recovery',
      'Report problems without world content',
    ],
  },
];

const screenshotChecks = [
  { name: 'overview-mobile', path: '/', size: '375,900' },
  { name: 'characters-mobile', path: '/characters', size: '375,900' },
  { name: 'data-mobile', path: '/data', size: '375,900' },
  { name: 'workspaces-tablet', path: '/workspaces', size: '768,900' },
  { name: 'help-mobile', path: '/help', size: '375,900' },
];

function writeLine(message) {
  process.stdout.write(`${message}\n`);
}

function writeError(message) {
  process.stderr.write(`${message}\n`);
}

function findBrowserExecutables() {
  const candidates =
    process.platform === 'win32'
      ? [
          process.env.VWB_BROWSER_PATH,
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
      ? [
          process.env.VWB_BROWSER_PATH,
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ]
      : [
          process.env.VWB_BROWSER_PATH,
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/microsoft-edge',
        ];

  return candidates.filter((candidate) => candidate && existsSync(candidate));
}

function requestUrl(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode ?? 0));
    });
    request.on('error', reject);
    request.setTimeout(2000, () => {
      request.destroy(new Error(`Timed out waiting for ${url}`));
    });
  });
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < serverReadyTimeoutMs) {
    try {
      const statusCode = await requestUrl(baseUrl);
      if (statusCode >= 200 && statusCode < 500) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Vite did not respond at ${baseUrl}`);
}

function startServer() {
  const viteBin = join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(
    process.execPath,
    [viteBin, '--host', host, '--port', String(port), '--strictPort'],
    {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });
  return { child, getOutput: () => output };
}

function browserBaseArgs(profilePrefix, profileName, size) {
  return [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-features=SkiaGraphite,Vulkan',
    '--disable-gpu-sandbox',
    '--force-device-scale-factor=1',
    '--no-sandbox',
    '--virtual-time-budget=12000',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${join(profileRoot, profilePrefix, profileName)}`,
    `--window-size=${size}`,
  ];
}

function runBrowser(browserPath, args) {
  const result = spawnSync(browserPath, args, {
    cwd: rootDir,
    encoding: 'utf8',
    timeout: browserTimeoutMs,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Browser exited with status ${result.status}: ${result.stderr}`
    );
  }

  return result;
}

function assertRouteText(browserPath, profilePrefix, routeCheck) {
  const url = `${baseUrl}${routeCheck.path}`;
  const routeSlug = routeCheck.path.replace(/[^a-z0-9]+/gi, '-') || 'root';
  const result = runBrowser(browserPath, [
    ...browserBaseArgs(profilePrefix, `dom-${routeSlug}`, '1280,900'),
    '--dump-dom',
    url,
  ]);
  const dom = result.stdout;
  const missingText = routeCheck.expectedText.filter(
    (text) => !dom.includes(text)
  );
  if (missingText.length > 0) {
    const domPath = join(artifactDir, `dom-${profilePrefix}-${routeSlug}.html`);
    writeFileSync(domPath, dom);
    throw new Error(
      `${routeCheck.path} did not render expected text: ${missingText.join(
        ', '
      )}. DOM saved to ${domPath}`
    );
  }
}

function assertScreenshot(browserPath, profilePrefix, screenshotCheck) {
  const outputPath = join(screenshotDir, `${screenshotCheck.name}.png`);
  runBrowser(browserPath, [
    ...browserBaseArgs(
      profilePrefix,
      `shot-${screenshotCheck.name}`,
      screenshotCheck.size
    ),
    `--screenshot=${outputPath}`,
    `${baseUrl}${screenshotCheck.path}`,
  ]);
  if (!existsSync(outputPath) || statSync(outputPath).size === 0) {
    throw new Error(`Screenshot was not written: ${outputPath}`);
  }
}

async function run() {
  const browserPaths = findBrowserExecutables();
  if (browserPaths.length === 0) {
    throw new Error(
      'No supported Chromium browser was found. Set VWB_BROWSER_PATH to Chrome, Edge, or Chromium.'
    );
  }

  rmSync(artifactDir, { recursive: true, force: true });
  mkdirSync(profileRoot, { recursive: true });
  mkdirSync(screenshotDir, { recursive: true });

  const server = startServer();
  try {
    await waitForServer();
    const failures = [];
    for (const [index, browserPath] of browserPaths.entries()) {
      const profilePrefix = `${index}-${basename(browserPath).replace(
        /[^a-z0-9]+/gi,
        '-'
      )}`;
      try {
        writeLine(`browser smoke using: ${browserPath}`);
        for (const routeCheck of routeChecks) {
          assertRouteText(browserPath, profilePrefix, routeCheck);
          writeLine(`route ok: ${routeCheck.path}`);
        }
        for (const screenshotCheck of screenshotChecks) {
          assertScreenshot(browserPath, profilePrefix, screenshotCheck);
          writeLine(`screenshot ok: ${screenshotCheck.name}`);
        }
        writeLine(`Browser smoke artifacts: ${artifactDir}`);
        return;
      } catch (error) {
        failures.push(
          `${browserPath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        writeError(`browser smoke failed for ${browserPath}`);
      }
    }
    throw new Error(
      `All browser smoke attempts failed.\n${failures.join('\n')}`
    );
  } finally {
    server.child.kill();
    await new Promise((resolve) => {
      server.child.once('exit', resolve);
      setTimeout(resolve, 1000);
    });
    if (server.child.exitCode && server.child.exitCode !== 0) {
      writeError(server.getOutput());
    }
  }
}

run().catch((error) => {
  writeError(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
