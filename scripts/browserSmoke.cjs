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
const WebSocket = require('ws');

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
const cdpTimeoutMs = 20000;

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
    path: '/factions?entryId=faction-cartographers-guild&intent=edit&query=Cartographers',
    expectedText: [
      'The Cartographers Guild',
      'Linked records',
      'Mira Rowan',
      'From - member of',
    ],
  },
  {
    path: '/relationships',
    expectedText: ['Relationships', 'Relationship Form', 'Graph view'],
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
      'Use character category to shape which character fields appear',
      'Use relationship-backed character fields',
      'related lore',
      'Report problems without world content',
    ],
  },
  {
    path: '/help?topic=timeline',
    expectedText: [
      'Focused help',
      'Timeline',
      'Use explicit order, eras, involved-record filters',
    ],
  },
];

const screenshotChecks = [
  { name: 'overview-narrow-mobile', path: '/', size: '320,900' },
  { name: 'overview-mobile', path: '/', size: '375,900' },
  { name: 'characters-mobile', path: '/characters', size: '375,900' },
  { name: 'data-mobile', path: '/data', size: '375,900' },
  { name: 'workspaces-tablet', path: '/workspaces', size: '768,900' },
  { name: 'help-mobile', path: '/help', size: '375,900' },
];

const layoutChecks = [
  {
    name: 'mobile-header-actions',
    path: '/',
    size: '375,900',
  },
  {
    name: 'narrow-mobile-header-actions',
    path: '/',
    size: '320,900',
  },
];

const characterEditorLayoutChecks = [
  {
    name: 'character-editor-direct-route',
    path: '/characters?entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan',
    selectEntry: false,
    size: '1365,900',
    verifyReviewMigration: true,
  },
  {
    name: 'character-editor-desktop',
    path: '/characters',
    selectEntry: true,
    size: '1365,900',
  },
  {
    name: 'character-editor-mobile',
    path: '/characters',
    selectEntry: true,
    size: '375,1000',
  },
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

function requestJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = get(url, { method }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if ((response.statusCode ?? 0) >= 400) {
          reject(new Error(`HTTP ${response.statusCode} from ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
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

function browserCdpBaseArgs(profilePrefix, profileName, size) {
  return browserBaseArgs(profilePrefix, profileName, size).filter(
    (arg) => !arg.startsWith('--virtual-time-budget=')
  );
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

function createCdpClient(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    let nextId = 1;
    const pending = new Map();
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out connecting to ${webSocketUrl}`));
      socket.close();
    }, 5000);

    socket.on('open', () => {
      clearTimeout(timeout);
      resolve({
        close: () => socket.close(),
        send(method, params = {}) {
          const id = nextId;
          nextId += 1;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((sendResolve, sendReject) => {
            pending.set(id, { reject: sendReject, resolve: sendResolve });
          });
        },
      });
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (!message.id) {
        return;
      }
      const callbacks = pending.get(message.id);
      if (!callbacks) {
        return;
      }
      pending.delete(message.id);
      if (message.error) {
        callbacks.reject(
          new Error(`${message.error.message}: ${message.error.data ?? ''}`)
        );
        return;
      }
      callbacks.resolve(message.result);
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function waitForDebugPage(debugPort, expectedUrl) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < cdpTimeoutMs) {
    try {
      const pages = await requestJson(`http://${host}:${debugPort}/json/list`);
      const page = pages.find(
        (item) => item.type === 'page' && item.url.startsWith(expectedUrl)
      );
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Chrome DevTools page did not appear for ${expectedUrl}`);
}

async function waitForRuntimeCondition(cdp, expression) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < cdpTimeoutMs) {
    const result = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });
    if (result.result.value) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for runtime condition: ${expression}`);
}

async function evaluateRuntime(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.text ?? 'Runtime evaluation failed.'
    );
  }
  return result.result.value;
}

async function assertMobileHeaderLayout(browserPath, profilePrefix, check) {
  const debugPort = 59000 + (process.pid % 1000);
  const url = `${baseUrl}${check.path}`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(profilePrefix, `layout-${check.name}`, check.size),
      `--remote-debugging-port=${debugPort}`,
      url,
    ],
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

  let cdp;
  try {
    const webSocketUrl = await waitForDebugPage(debugPort, url);
    cdp = await createCdpClient(webSocketUrl);
    await waitForRuntimeCondition(
      cdp,
      "document.readyState !== 'loading' && Boolean(document.querySelector('.vwb-save-status'))"
    );
    const headerResult = await evaluateRuntime(
      cdp,
      `(() => {
        const selectors = {
          brand: '.vwb-brand',
          nav: '.vwb-top-nav',
          save: '.vwb-save-status',
          dataMenu: '.vwb-header-menu > button'
        };
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight;
        const issues = [];
        const rects = {};
        for (const [name, selector] of Object.entries(selectors)) {
          const element = document.querySelector(selector);
          if (!element) {
            issues.push(name + ' is missing');
            continue;
          }
          const rect = element.getBoundingClientRect();
          rects[name] = {
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            width: Math.round(rect.width)
          };
          if (rect.width <= 0 || rect.height <= 0) {
            issues.push(name + ' has no visible size');
          }
          if (rect.left < 0 || rect.right > viewportWidth) {
            issues.push(name + ' is clipped horizontally');
          }
          if (rect.top < 0 || rect.bottom > viewportHeight) {
            issues.push(name + ' is clipped vertically');
          }
        }
        return { issues, rects, viewportHeight, viewportWidth };
      })()`
    );
    if (headerResult.issues.length > 0) {
      throw new Error(
        `${check.name} layout issues: ${headerResult.issues.join(
          ', '
        )}. Rects: ${JSON.stringify(headerResult.rects)}`
      );
    }

    const overflowResult = await evaluateRuntime(
      cdp,
      `(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const overflowers = Array.from(document.body.querySelectorAll('*'))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              className: element.className,
              nodeName: element.nodeName,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            };
          })
          .filter((item) => item.width > 0 && item.right > viewportWidth + 1)
          .slice(0, 8);
        return {
          clientWidth: viewportWidth,
          issues: document.documentElement.scrollWidth > viewportWidth + 1
            ? ['page has horizontal overflow']
            : [],
          overflowers,
          scrollWidth: document.documentElement.scrollWidth
        };
      })()`
    );
    if (overflowResult.issues.length > 0) {
      throw new Error(
        `${check.name} page overflow: ${JSON.stringify(overflowResult)}`
      );
    }

    await evaluateRuntime(
      cdp,
      "document.querySelector('.vwb-header-menu > button')?.click(); true"
    );
    await waitForRuntimeCondition(
      cdp,
      "Boolean(document.querySelector('.vwb-header-menu-list'))"
    );
    const menuResult = await evaluateRuntime(
      cdp,
      `(() => {
        const menu = document.querySelector('.vwb-header-menu-list');
        const viewportWidth = document.documentElement.clientWidth;
        const issues = [];
        if (!menu) {
          issues.push('data menu list did not open');
          return { issues, rect: null, itemCount: 0 };
        }
        const rect = menu.getBoundingClientRect();
        const itemCount = menu.querySelectorAll('button, a').length;
        if (itemCount < 4) {
          issues.push('data menu has too few actions');
        }
        if (rect.left < 0 || rect.right > viewportWidth) {
          issues.push('data menu list is clipped horizontally');
        }
        return {
          issues,
          itemCount,
          rect: {
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            width: Math.round(rect.width)
          }
        };
      })()`
    );
    if (menuResult.issues.length > 0) {
      throw new Error(
        `${check.name} menu issues: ${menuResult.issues.join(
          ', '
        )}. Rect: ${JSON.stringify(menuResult.rect)}`
      );
    }
  } finally {
    cdp?.close();
    child.kill();
    await new Promise((resolve) => {
      child.once('exit', resolve);
      setTimeout(resolve, 1000);
    });
    if (child.exitCode && child.exitCode !== 0) {
      writeError(output);
    }
  }
}

async function assertCharacterEditorLayout(browserPath, profilePrefix, check) {
  const debugPort = 60000 + (process.pid % 1000);
  const url = `${baseUrl}${check.path}`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(
        profilePrefix,
        `character-layout-${check.name}`,
        check.size
      ),
      `--remote-debugging-port=${debugPort}`,
      url,
    ],
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

  let cdp;
  try {
    const webSocketUrl = await waitForDebugPage(debugPort, url);
    cdp = await createCdpClient(webSocketUrl);
    await waitForRuntimeCondition(
      cdp,
      "document.readyState !== 'loading' && Boolean(document.querySelector('form.vwb-form'))"
    );
    if (check.selectEntry) {
      const clickedCharacter = await evaluateRuntime(
        cdp,
        `(() => {
          const card = Array.from(document.querySelectorAll('.vwb-entry-card'))
            .find((element) => element.textContent?.includes('Mira Rowan'));
          if (!(card instanceof HTMLElement)) {
            return false;
          }
          card.click();
          return true;
        })()`
      );
      if (!clickedCharacter) {
        throw new Error(`${check.name} could not click the Mira Rowan card`);
      }
    }
    await waitForRuntimeCondition(
      cdp,
      "Array.from(document.querySelectorAll('h2')).some((node) => node.textContent?.trim() === 'Mira Rowan')"
    );
    const relationshipDetailResult = await evaluateRuntime(
      cdp,
      `(() => {
        const detailPanel = Array.from(document.querySelectorAll('.vwb-detail-panel'))
          .find((panel) => panel.textContent?.includes('Mira Rowan'));
        const issues = [];
        if (!detailPanel) {
          issues.push('selected character detail panel is missing');
          return { issues };
        }
        const relationshipPanel = detailPanel.querySelector('.vwb-relationship-panel');
        if (!relationshipPanel) {
          issues.push('character relationship panel is missing');
          return { issues };
        }
        const groupHeadings = Array.from(
          relationshipPanel.querySelectorAll('.vwb-relationship-group > h4')
        )
          .map((heading) => heading.textContent?.trim())
          .filter(Boolean);
        if (!groupHeadings.includes('Affiliations and service')) {
          issues.push('character relationship group is missing');
        }
        const relationshipText = relationshipPanel.textContent || '';
        for (const text of ['The Cartographers Guild', 'To - member of']) {
          if (!relationshipText.includes(text)) {
            issues.push('missing relationship detail: ' + text);
          }
        }
        return {
          groupHeadings,
          issues,
          relationshipText: relationshipText.replace(/\\s+/g, ' ').trim().slice(0, 240)
        };
      })()`
    );
    if (relationshipDetailResult.issues.length > 0) {
      throw new Error(
        `${
          check.name
        } character relationship detail issues: ${relationshipDetailResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(relationshipDetailResult)}`
      );
    }
    const result = await evaluateRuntime(
      cdp,
      `(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const issues = [];
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
          .map((heading) => heading.textContent?.trim())
          .filter(Boolean);
        if (!headings.some((heading) => heading === 'Mira Rowan')) {
          issues.push('selected character editor is not open');
        }
        const reviewPanel = document.querySelector('[aria-label="Legacy relationship link text review"]');
        if (!reviewPanel) {
          issues.push('legacy relationship text review panel is missing');
        } else {
          const reviewText = reviewPanel.textContent || '';
          for (const text of [
            'Legacy Link Text',
            'Mira Rowan',
            'Affiliations',
            'Unresolved: None. 1 exact match available.'
          ]) {
            if (!reviewText.includes(text)) {
              issues.push('missing legacy review detail: ' + text);
            }
          }
        }
        const requiredHeadings = [
          'Record basics',
          'Category and role',
          'Identity and origin',
          'Profession and power'
        ];
        const headingText = Array.from(document.querySelectorAll('.vwb-field-group > h3'))
          .map((heading) => heading.textContent?.trim())
          .filter(Boolean);
        for (const heading of requiredHeadings) {
          if (!headingText.includes(heading)) {
            issues.push('missing field group: ' + heading);
          }
        }
        const linkedFieldPanel = document.querySelector(
          '[aria-label="Relationship-backed character fields"]'
        );
        if (!linkedFieldPanel) {
          issues.push('linked character field panel is missing');
        } else {
          const linkedLabels = Array.from(linkedFieldPanel.querySelectorAll('h4'))
            .map((heading) => heading.textContent?.trim())
            .filter(Boolean);
          for (const label of ['Home', 'Affiliations']) {
            if (!linkedLabels.includes(label)) {
              issues.push('missing linked character control: ' + label);
            }
          }
        }
        const emptyGroups = Array.from(document.querySelectorAll('.vwb-field-group'))
          .filter((group) => !group.querySelector('input, textarea, select'))
          .map((group) => group.querySelector('h3')?.textContent?.trim() || 'unnamed');
        if (emptyGroups.length > 0) {
          issues.push('empty field groups: ' + emptyGroups.join(', '));
        }
        const overflowers = Array.from(document.body.querySelectorAll('*'))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              className: String(element.className || ''),
              nodeName: element.nodeName,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            };
          })
          .filter((item) => item.width > 0 && item.right > viewportWidth + 1)
          .slice(0, 8);
        if (document.documentElement.scrollWidth > viewportWidth + 1) {
          issues.push('page has horizontal overflow');
        }
        return {
          fieldGroupCount: headingText.length,
          headings: headings.slice(0, 24),
          headingText,
          issues,
          location: window.location.href,
          overflowers,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth
        };
      })()`
    );
    if (result.issues.length > 0) {
      throw new Error(
        `${check.name} character editor issues: ${result.issues.join(
          ', '
        )}. Details: ${JSON.stringify(result)}`
      );
    }
    if (check.verifyReviewMigration) {
      const migrationClickResult = await evaluateRuntime(
        cdp,
        `(() => {
          const reviewPanel = document.querySelector('[aria-label="Legacy relationship link text review"]');
          const issues = [];
          if (!reviewPanel) {
            return { issues: ['legacy relationship text review panel is missing'] };
          }
          const row = Array.from(reviewPanel.querySelectorAll('.vwb-relationship-row'))
            .find((candidate) => {
              const text = candidate.textContent || '';
              return text.includes('Mira Rowan')
                && text.includes('Affiliations')
                && text.includes('Unresolved: None. 1 exact match available.');
            });
          if (!row) {
            return {
              issues: ['exact-only legacy relationship text row is missing'],
              reviewText: reviewPanel.textContent?.replace(/\\s+/g, ' ').trim().slice(0, 240)
            };
          }
          const button = Array.from(row.querySelectorAll('button'))
            .find((candidate) => candidate.textContent?.trim() === 'Migrate Exact Matches');
          if (!(button instanceof HTMLElement)) {
            return { issues: ['row-level exact-match migration button is missing'] };
          }
          button.click();
          return { issues: [] };
        })()`
      );
      if (migrationClickResult.issues.length > 0) {
        throw new Error(
          `${
            check.name
          } character review migration click issues: ${migrationClickResult.issues.join(
            ', '
          )}. Details: ${JSON.stringify(migrationClickResult)}`
        );
      }
      await waitForRuntimeCondition(
        cdp,
        `(() => {
          const reviewPanel = document.querySelector('[aria-label="Legacy relationship link text review"]');
          if (!reviewPanel) {
            return true;
          }
          return !Array.from(reviewPanel.querySelectorAll('.vwb-relationship-row'))
            .some((candidate) => {
              const text = candidate.textContent || '';
              return text.includes('Mira Rowan')
                && text.includes('Affiliations')
                && text.includes('1 exact match available.');
            });
        })()`
      );
      const migrationResult = await evaluateRuntime(
        cdp,
        `(() => {
          const issues = [];
          const reviewPanel = document.querySelector('[aria-label="Legacy relationship link text review"]');
          const reviewText = reviewPanel?.textContent || '';
          if (
            reviewText.includes('Mira Rowan')
            && reviewText.includes('Affiliations')
            && reviewText.includes('1 exact match available.')
          ) {
            issues.push('exact-only legacy relationship row still appears after migration');
          }
          const detailPanel = Array.from(document.querySelectorAll('.vwb-detail-panel'))
            .find((panel) => panel.textContent?.includes('Mira Rowan'));
          const detailText = detailPanel?.textContent || '';
          for (const text of ['The Cartographers Guild', 'To - member of']) {
            if (!detailText.includes(text)) {
              issues.push('missing relationship after migration: ' + text);
            }
          }
          return {
            detailText: detailText.replace(/\\s+/g, ' ').trim().slice(0, 240),
            issues,
            reviewText: reviewText.replace(/\\s+/g, ' ').trim().slice(0, 240)
          };
        })()`
      );
      if (migrationResult.issues.length > 0) {
        throw new Error(
          `${
            check.name
          } character review migration issues: ${migrationResult.issues.join(
            ', '
          )}. Details: ${JSON.stringify(migrationResult)}`
        );
      }
    }
  } finally {
    cdp?.close();
    child.kill();
    await new Promise((resolve) => {
      child.once('exit', resolve);
      setTimeout(resolve, 1000);
    });
    if (child.exitCode && child.exitCode !== 0) {
      writeError(output);
    }
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
        for (const layoutCheck of layoutChecks) {
          await assertMobileHeaderLayout(
            browserPath,
            profilePrefix,
            layoutCheck
          );
          writeLine(`layout ok: ${layoutCheck.name}`);
        }
        for (const characterEditorLayoutCheck of characterEditorLayoutChecks) {
          await assertCharacterEditorLayout(
            browserPath,
            profilePrefix,
            characterEditorLayoutCheck
          );
          writeLine(`layout ok: ${characterEditorLayoutCheck.name}`);
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
