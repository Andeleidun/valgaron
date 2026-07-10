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
const runId = `run-${process.pid}-${Date.now()}`;
const profileRoot = join(artifactDir, 'profiles', runId);
const screenshotDir = join(artifactDir, 'screenshots', runId);
const serverReadyTimeoutMs = 15000;
const browserTimeoutMs = Number(process.env.VWB_BROWSER_TIMEOUT_MS ?? 90000);
const cdpTimeoutMs = 20000;

function removePathIfPossible(path) {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch (error) {
    writeLine(`warning: could not remove ${path}: ${error.message}`);
  }
}

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
    path: '/entries?sectionId=characters',
    expectedText: [
      'Workbench',
      'Find and choose a record',
      'Characters',
      'Mira Rowan',
    ],
  },
  {
    path: '/entries?sectionId=characters&intent=new',
    expectedText: [
      'Workbench',
      'New Character',
      'Character basics',
      'Create Character',
    ],
  },
  {
    path: '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan',
    expectedText: [
      'Workbench',
      'Characters',
      'Edit entry',
      'Mira Rowan',
      'Record basics',
      'Linked character fields',
    ],
  },
  {
    path: '/entries?sectionId=characters&entryId=character-mira-rowan&intent=context&query=Mira%20Rowan',
    expectedText: [
      'Workbench',
      'Find and choose a record',
      'Selected context',
      'Mira Rowan',
      'Relationships',
      'Completeness',
      'Review summary',
      'Legacy link text',
      'The Cartographers Guild',
      'Edit Record',
      'Manage Links',
    ],
  },
  {
    path: '/entries?sectionId=factions&entryId=faction-cartographers-guild&intent=edit&query=Cartographers',
    expectedText: [
      'Workbench',
      'Edit entry',
      'The Cartographers Guild',
      'Linked records',
      'Mira Rowan',
      'From - member of',
    ],
  },
  {
    path: '/relationships',
    expectedText: [
      'Relationships',
      'Relationship Studio',
      'Review',
      'Broken references',
      'Orphaned records',
      'Legacy Link Text',
    ],
  },
  {
    path: '/relationships?entryId=character-mira-rowan&entryQuery=Mira%20Rowan&relationshipQuery=Mira%20Rowan',
    expectedText: [
      'Relationship Studio',
      'Links',
      'Relationship Form',
      'Saved Relationships',
      'Mira Rowan',
    ],
  },
  {
    path: '/timeline',
    expectedText: [
      'Timeline',
      'Timeline view',
      'Era Manager',
      'Apply Era Change',
      'Timeline table',
    ],
  },
  {
    path: '/timeline?intent=new&era=Charter%20Era&involvedEntryId=faction-cartographers-guild',
    expectedText: [
      'Timeline',
      'Create Timeline Event',
      'Charter Era',
      'Involved records',
      'The Cartographers Guild',
      'Create Timeline Event And 1 Link',
    ],
  },
  {
    path: '/knowledge',
    expectedText: [
      'Knowledge',
      'Knowledge Schema',
      'Entry Types And Fields',
      'Type Setup',
      'Field Configuration',
      'Reusable Knowledge',
      'Ancestry',
      'Suggested choices',
      'Open Characters',
      'Lore Definition Types',
      'Travel custom',
      'involves',
      'Characters',
      'Relationship-backed fields',
    ],
  },
  {
    path: '/knowledge#custom-entry-types',
    expectedText: ['Knowledge', 'Custom entry types', 'Create Entry Type'],
  },
  {
    path: '/knowledge#hidden-detail-cleanup',
    expectedText: [
      'Knowledge',
      'Hidden Detail Cleanup',
      'No hidden detail cleanup targets.',
    ],
  },
  {
    path: '/utilities',
    expectedText: [
      'Utilities',
      'Project Tools',
      'Knowledge Schema',
      '5 entry types',
      'No hidden detail cleanup targets.',
      'Tool shortcuts',
      'Open Data',
      'Open Help',
      'Review hotspots',
      'Open 10 Incomplete Records',
      'Open the Incomplete Workbench queue before reviewing other record signals.',
      'Open Relationship Review',
      'Knowledge Setup',
      'Open Knowledge Setup. Manage custom entry types, reusable fields, and knowledge structure.',
      'Data Tools',
      'Workspaces',
      'Help',
    ],
  },
  {
    path: '/utilities#project-tools',
    expectedText: [
      'Utilities',
      'Project Tools',
      'Knowledge Schema',
      'Tool shortcuts',
      'Review hotspots',
      'Open 10 Incomplete Records',
    ],
  },
  {
    path: '/utilities#data-tools',
    expectedText: ['Utilities', 'Data Tools', 'Open Data'],
  },
  {
    path: '/utilities#knowledge-setup',
    expectedText: ['Utilities', 'Knowledge Setup', 'Open Knowledge Setup'],
  },
  {
    path: '/utilities#workspaces',
    expectedText: ['Utilities', 'Workspaces', 'Open Workspaces'],
  },
  {
    path: '/utilities#help',
    expectedText: ['Utilities', 'Help', 'Open Help'],
  },
  {
    path: '/data',
    expectedText: [
      'Data',
      'Manual local save',
      'Active workspace JSON',
      'Full document JSON',
      'Import JSON or ZIP backup',
    ],
  },
  {
    path: '/workspaces',
    expectedText: [
      'Workspaces',
      'Project/universe workspaces',
      'In-fiction worlds and planets',
      'New world',
    ],
  },
  {
    path: '/help',
    expectedText: [
      'Help',
      'Help topics',
      'Backups and recovery',
      'Use character category to shape which character fields appear',
      'Use relationship-backed character fields',
      'related lore',
      'Report problems without world content',
      'Read Privacy Policy',
    ],
    expectedLinks: [
      {
        href: '/utilities#project-tools',
        label: 'Open Utilities',
      },
      {
        href: '/help?topic=timeline',
        label: 'Timeline',
      },
      {
        href: '/privacy',
        label: 'Read Privacy Policy',
      },
    ],
  },
  {
    path: '/privacy',
    expectedText: [
      'Valgaron World Codex Privacy Policy',
      'Effective date: July 9, 2026',
      'What Valgaron Stores Locally',
      'What Valgaron Does Not Collect',
      'We do not sell user data.',
    ],
  },
  {
    path: '/help?topic=timeline',
    expectedText: [
      'Focused help',
      'Timeline',
      'Use explicit order, grouped event editing, Era Manager reassignment',
    ],
  },
  {
    path: '/help?topic=utilities',
    expectedText: [
      'Focused help',
      'Utilities',
      'Use Utilities or mobile More for the Project Tools hub',
      'Help topics',
      'Review Hotspots',
      'Open Utilities',
    ],
    expectedLinks: [
      {
        current: true,
        href: '/help?topic=utilities',
        label: 'Utilities',
      },
      {
        href: '/utilities#project-tools',
        label: 'Open Utilities',
      },
    ],
  },
];

const screenshotChecks = [
  { name: 'overview-narrow-mobile', path: '/', size: '320,900' },
  { name: 'overview-mobile', path: '/', size: '375,900' },
  { name: 'workbench-mobile', path: '/entries', size: '375,900' },
  { name: 'timeline-mobile', path: '/timeline', size: '375,900' },
  {
    name: 'characters-mobile',
    path: '/entries?sectionId=characters',
    size: '375,900',
  },
  { name: 'links-mobile', path: '/relationships', size: '375,900' },
  { name: 'knowledge-mobile', path: '/knowledge', size: '375,900' },
  { name: 'more-mobile', path: '/utilities', size: '375,900' },
  { name: 'data-mobile', path: '/data', size: '375,900' },
  { name: 'worlds-mobile', path: '/workspaces', size: '375,900' },
  { name: 'workspaces-tablet', path: '/workspaces', size: '768,900' },
  { name: 'help-mobile', path: '/help', size: '375,900' },
];

const layoutChecks = [
  {
    name: 'mobile-header-actions',
    path: '/',
    size: '375,900',
    expectedVisibleNavLabels: ['Workbench', 'Timeline', 'Links', 'More'],
  },
  {
    name: 'narrow-mobile-header-actions',
    path: '/',
    size: '320,900',
    expectedVisibleNavLabels: ['Workbench', 'Timeline', 'Links', 'More'],
  },
];

const characterEditorLayoutChecks = [
  {
    name: 'character-editor-direct-route',
    path: '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan',
    selectEntry: false,
    size: '1365,900',
  },
  {
    name: 'character-editor-desktop',
    path: '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan',
    selectEntry: false,
    size: '1365,900',
  },
  {
    name: 'character-editor-mobile',
    path: '/entries?sectionId=characters&entryId=character-mira-rowan&intent=edit&query=Mira%20Rowan',
    selectEntry: false,
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const anchors = [...dom.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(
    (match) => match[0]
  );
  const missingLinks = (routeCheck.expectedLinks ?? []).filter((link) => {
    const escapedLabel = escapeRegExp(link.label);
    const escapedRelativeHref = escapeRegExp(link.href);
    const escapedAbsoluteHref = escapeRegExp(`${baseUrl}${link.href}`);
    const hrefPattern = new RegExp(
      `href="(?:${escapedRelativeHref}|${escapedAbsoluteHref})"`
    );
    const labelPattern = new RegExp(escapedLabel);
    const currentPattern = /aria-current="page"/;
    return !anchors.some(
      (anchor) =>
        hrefPattern.test(anchor) &&
        labelPattern.test(anchor) &&
        (!link.current || currentPattern.test(anchor))
    );
  });
  if (missingLinks.length > 0) {
    const domPath = join(artifactDir, `dom-${profilePrefix}-${routeSlug}.html`);
    writeFileSync(domPath, dom);
    throw new Error(
      `${routeCheck.path} did not render expected links: ${missingLinks
        .map((link) => `${link.label} -> ${link.href}`)
        .join(', ')}. DOM saved to ${domPath}`
    );
  }
}

async function assertRelationshipGraphNodeActions(browserPath, profilePrefix) {
  const debugPort = 60000 + (process.pid % 1000);
  const url = `${baseUrl}/relationships`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(
        profilePrefix,
        'relationship-graph-actions',
        '1280,900'
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
      "document.readyState !== 'loading' && document.body.textContent.includes('Relationship Studio')"
    );
    const graphClickResult = await evaluateRuntime(
      cdp,
      `(() => {
        const graphButton = Array.from(document.querySelectorAll('button'))
          .find((button) => button.textContent?.trim() === 'Graph');
        if (!(graphButton instanceof HTMLElement)) {
          return { issues: ['Graph mode button is missing'] };
        }
        graphButton.click();
        return { issues: [] };
      })()`
    );
    if (graphClickResult.issues.length > 0) {
      throw new Error(
        `relationship graph mode issues: ${graphClickResult.issues.join(', ')}`
      );
    }
    await waitForRuntimeCondition(
      cdp,
      "Boolean(document.querySelector('.vwb-graph-node'))"
    );
    const nodeClickResult = await evaluateRuntime(
      cdp,
      `(() => {
        const nodeButton = Array.from(document.querySelectorAll('.vwb-graph-node'))
          .find((button) => button.textContent?.includes('Mira Rowan'));
        if (!(nodeButton instanceof HTMLElement)) {
          return { issues: ['Mira Rowan graph node is missing'] };
        }
        nodeButton.click();
        return { issues: [] };
      })()`
    );
    if (nodeClickResult.issues.length > 0) {
      throw new Error(
        `relationship graph node click issues: ${nodeClickResult.issues.join(
          ', '
        )}`
      );
    }
    await waitForRuntimeCondition(
      cdp,
      "document.querySelector('.vwb-graph-detail')?.textContent.includes('Review Context')"
    );
    const detailResult = await evaluateRuntime(
      cdp,
      `(() => {
        const detail = document.querySelector('.vwb-graph-detail');
        const detailText = detail?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
        const issues = [];
        for (const text of ['Mira Rowan', 'Review Context', 'Filter List', 'member of']) {
          if (!detailText.includes(text)) {
            issues.push('missing selected node detail text: ' + text);
          }
        }
        const openEntry = detail?.querySelector('a[href*="entryId=character-mira-rowan"][href*="intent=context"]');
        if (!openEntry) {
          issues.push('selected node Review Context link is missing or does not target entry context');
        }
        const filterButton = Array.from(detail?.querySelectorAll('button') ?? [])
          .find((button) => button.textContent?.trim() === 'Filter List');
        if (!(filterButton instanceof HTMLElement)) {
          issues.push('selected node Filter List button is missing');
        }
        return { detailText, issues };
      })()`
    );
    if (detailResult.issues.length > 0) {
      throw new Error(
        `relationship graph selected node issues: ${detailResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(detailResult)}`
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

async function assertTimelineContextCreateRouteReseeds(
  browserPath,
  profilePrefix
) {
  const debugPort = 61000 + (process.pid % 1000);
  const initialPath =
    '/timeline?intent=new&era=Charter%20Era&involvedEntryId=faction-cartographers-guild';
  const nextPath =
    '/timeline?intent=new&era=Northwatch%20Era&involvedEntryId=place-northwatch-harbor';
  const url = `${baseUrl}${initialPath}`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(
        profilePrefix,
        'timeline-context-create-reseed',
        '1280,900'
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
      "document.body.textContent.includes('The Cartographers Guild')"
    );
    await evaluateRuntime(
      cdp,
      `(() => {
        window.history.pushState({}, '', '${nextPath}');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return true;
      })()`
    );
    await waitForRuntimeCondition(
      cdp,
      "document.body.textContent.includes('Northwatch Harbor')"
    );
    const reseedResult = await evaluateRuntime(
      cdp,
      `(() => {
        const bodyText = document.body.textContent || '';
        const selectedInvolvedText =
          document.querySelector('[aria-label="Selected involved records"]')
            ?.textContent || '';
        const issues = [];
        if (!bodyText.includes('Create Timeline Event')) {
          issues.push('timeline create editor is missing');
        }
        if (!selectedInvolvedText.includes('Northwatch Harbor')) {
          issues.push('new involved-record staged link is missing');
        }
        if (selectedInvolvedText.includes('The Cartographers Guild')) {
          issues.push('previous involved-record staged link is still shown');
        }
        const northwatchEraInput = Array.from(document.querySelectorAll('input'))
          .find((input) => input.value === 'Northwatch Era');
        if (!northwatchEraInput) {
          issues.push('timeline draft era was not reseeded');
        }
        return {
          issues,
          location: window.location.pathname + window.location.search,
          selectedInvolvedText
        };
      })()`
    );
    if (reseedResult.issues.length > 0) {
      throw new Error(
        `timeline contextual create route reseed issues: ${reseedResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(reseedResult)}`
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

async function assertWorkbenchDirtyRouteGuard(browserPath, profilePrefix) {
  const debugPort = 61500 + (process.pid % 1000);
  const initialPath =
    '/entries?sectionId=characters&entryId=character-mira-rowan&intent=context&query=Mira%20Rowan';
  const nextPath =
    '/entries?sectionId=places&entryId=place-northwatch-harbor&intent=context&query=Northwatch';
  const url = `${baseUrl}${initialPath}`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(
        profilePrefix,
        'workbench-dirty-route-guard',
        '1280,900'
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
      "document.body.textContent.includes('Workbench') && document.body.textContent.includes('Mira Rowan')"
    );
    const dirtyResult = await evaluateRuntime(
      cdp,
      `(() => {
        window.__workbenchConfirmCount = 0;
        window.__workbenchConfirmMessage = '';
        window.confirm = (message) => {
          window.__workbenchConfirmCount += 1;
          window.__workbenchConfirmMessage = String(message);
          return false;
        };
        const editor = document.querySelector('[aria-label="Character Workbench editor"]');
        const nameInput = Array.from(editor?.querySelectorAll('input') ?? [])
          .find((input) => input.value === 'Mira Rowan');
        const issues = [];
        if (!(nameInput instanceof HTMLInputElement)) {
          issues.push('selected Workbench name input is missing');
          return { issues };
        }
        const valueDescriptor = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        );
        valueDescriptor?.set?.call(nameInput, 'Mira Rowan Dirty');
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        return { issues };
      })()`
    );
    if (dirtyResult.issues.length > 0) {
      throw new Error(
        `workbench dirty setup issues: ${dirtyResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(dirtyResult)}`
      );
    }
    await waitForRuntimeCondition(
      cdp,
      "Array.from(document.querySelectorAll('input')).some((input) => input.value === 'Mira Rowan Dirty')"
    );
    await evaluateRuntime(
      cdp,
      `(() => {
        window.history.pushState({}, '', '${nextPath}');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return true;
      })()`
    );
    await waitForRuntimeCondition(cdp, 'window.__workbenchConfirmCount > 0');
    const guardResult = await evaluateRuntime(
      cdp,
      `(() => {
        const editor = document.querySelector('[aria-label="Character Workbench editor"]');
        const dirtyInput = Array.from(editor?.querySelectorAll('input') ?? [])
          .find((input) => input.value === 'Mira Rowan Dirty');
        const issues = [];
        if (window.__workbenchConfirmCount !== 1) {
          issues.push('discard confirmation count is ' + window.__workbenchConfirmCount);
        }
        if (!window.__workbenchConfirmMessage.includes('Discard unsaved changes?')) {
          issues.push('discard confirmation copy was not used');
        }
        if (!(dirtyInput instanceof HTMLInputElement)) {
          issues.push('dirty Workbench draft was replaced after canceling route change');
        }
        if (document.querySelector('[aria-label="Place Workbench editor"]')) {
          issues.push('route replacement applied despite canceling discard');
        }
        return {
          confirmCount: window.__workbenchConfirmCount,
          confirmMessage: window.__workbenchConfirmMessage,
          issues
        };
      })()`
    );
    if (guardResult.issues.length > 0) {
      throw new Error(
        `workbench dirty route guard issues: ${guardResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(guardResult)}`
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

async function assertWorkbenchReviewQueueRoute(browserPath, profilePrefix) {
  const debugPort = 61750 + (process.pid % 1000);
  const path = '/entries?view=unlinked';
  const url = `${baseUrl}${path}`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(
        profilePrefix,
        'workbench-review-queue-route',
        '1280,900'
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
      "document.body.textContent.includes('Workbench') && document.body.textContent.includes('The Ember Court')"
    );
    const result = await evaluateRuntime(
      cdp,
      `(() => {
        const issues = [];
        const activeView = Array.from(
          document.querySelectorAll('[aria-label="Workbench views"] button')
        ).find((button) => button.getAttribute('aria-pressed') === 'true');
        if (!activeView?.textContent?.includes('Unlinked')) {
          issues.push('Unlinked Workbench view is not active');
        }
        const recordCards = Array.from(document.querySelectorAll('.vwb-entry-card'));
        const emberCourtCard = recordCards.find((card) =>
          card.textContent?.includes('The Ember Court')
        );
        if (!emberCourtCard) {
          issues.push('seed unlinked record is missing from the queue');
        }
        if (document.body.textContent.includes('No records in this view.')) {
          issues.push('review queue rendered the empty state');
        }
        return {
          activeViewText: activeView?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
          cardCount: recordCards.length,
          issues,
          location: window.location.pathname + window.location.search
        };
      })()`
    );
    if (result.issues.length > 0) {
      throw new Error(
        `workbench review queue route issues: ${result.issues.join(
          ', '
        )}. Details: ${JSON.stringify(result)}`
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

async function assertKnowledgeDestructiveDialog(browserPath, profilePrefix) {
  const debugPort = 62000 + (process.pid % 1000);
  const url = `${baseUrl}/knowledge#custom-entry-types`;
  const child = spawn(
    browserPath,
    [
      ...browserCdpBaseArgs(
        profilePrefix,
        'knowledge-destructive-dialog',
        '1280,900'
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
      "document.body.textContent.includes('Custom entry types') && document.body.textContent.includes('Create Entry Type')"
    );
    const createResult = await evaluateRuntime(
      cdp,
      `(() => {
        const issues = [];
        const createForm = Array.from(document.querySelectorAll('form'))
          .find((form) => form.textContent?.includes('Create entry type'));
        const setControlValue = (labelText, value) => {
          const label = Array.from(createForm?.querySelectorAll('label') ?? [])
            .find((candidate) => candidate.textContent?.includes(labelText));
          const control = label?.querySelector('input, textarea');
          if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
            issues.push(labelText + ' control is missing');
            return;
          }
          const valueDescriptor = Object.getOwnPropertyDescriptor(
            control instanceof HTMLTextAreaElement
              ? HTMLTextAreaElement.prototype
              : HTMLInputElement.prototype,
            'value'
          );
          valueDescriptor?.set?.call(control, value);
          control.dispatchEvent(new Event('input', { bubbles: true }));
        };
        if (!createForm) {
          issues.push('create entry type form is missing');
          return { issues };
        }
        setControlValue('Section title', 'Smoke Relics');
        setControlValue('Singular title', 'Smoke Relic');
        setControlValue('Description', 'Temporary smoke-test custom type.');
        setControlValue('Detail fields', 'Origin');
        if (issues.length > 0) {
          return { issues };
        }
        const submitButton = Array.from(createForm.querySelectorAll('button'))
          .find((button) => button.textContent?.trim() === 'Create Entry Type');
        if (!(submitButton instanceof HTMLElement)) {
          issues.push('create entry type submit button is missing');
          return { issues };
        }
        submitButton.click();
        return { issues };
      })()`
    );
    if (createResult.issues.length > 0) {
      throw new Error(
        `knowledge custom type setup issues: ${createResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(createResult)}`
      );
    }
    await waitForRuntimeCondition(
      cdp,
      "Boolean(Array.from(document.querySelectorAll('.vwb-entry-card')).find((card) => card.textContent?.includes('Smoke Relics'))?.querySelector('button[aria-label=\"Remove Origin\"]'))"
    );
    const openResult = await evaluateRuntime(
      cdp,
      `(() => {
        const customTypeCard = Array.from(document.querySelectorAll('.vwb-entry-card'))
          .find((row) => row.textContent?.includes('Smoke Relics'));
        const removeButton = customTypeCard?.querySelector('button[aria-label="Remove Origin"]');
        const issues = [];
        if (!customTypeCard) {
          issues.push('created custom type card is missing');
          return { issues };
        }
        if (!(removeButton instanceof HTMLElement)) {
          issues.push('remove-field button is missing');
          return { issues };
        }
        removeButton.focus();
        removeButton.click();
        return {
          issues,
          removeButtonLabel: removeButton.getAttribute('aria-label')
        };
      })()`
    );
    if (openResult.issues.length > 0) {
      throw new Error(
        `knowledge destructive dialog open issues: ${openResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(openResult)}`
      );
    }
    await waitForRuntimeCondition(
      cdp,
      'Boolean(document.querySelector(\'[role="dialog"][aria-modal="true"]\'))'
    );
    const dialogResult = await evaluateRuntime(
      cdp,
      `(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        const issues = [];
        if (!dialog) {
          issues.push('dialog is missing');
          return { issues };
        }
        const text = dialog.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
        const activeText = document.activeElement?.textContent?.trim() ?? '';
        if (!text.includes('Knowledge schema action')) {
          issues.push('dialog kicker is missing');
        }
        if (!text.includes('Remove') || !text.includes('Existing entry values stay saved as hidden details')) {
          issues.push('remove-field destructive copy is missing');
        }
        if (activeText !== 'Cancel') {
          issues.push('initial dialog focus is not on Cancel');
        }
        return {
          activeText,
          issues,
          text
        };
      })()`
    );
    if (dialogResult.issues.length > 0) {
      throw new Error(
        `knowledge destructive dialog issues: ${dialogResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(dialogResult)}`
      );
    }
    await cdp.send('Input.dispatchKeyEvent', {
      key: 'Escape',
      type: 'keyDown',
      windowsVirtualKeyCode: 27,
    });
    await waitForRuntimeCondition(
      cdp,
      '!document.querySelector(\'[role="dialog"][aria-modal="true"]\')'
    );
    const closeResult = await evaluateRuntime(
      cdp,
      `(() => {
        const issues = [];
        const activeLabel = document.activeElement?.getAttribute('aria-label') ?? '';
        if (!activeLabel.startsWith('Remove ')) {
          issues.push('focus did not return to the remove-field trigger');
        }
        return {
          activeLabel,
          issues
        };
      })()`
    );
    if (closeResult.issues.length > 0) {
      throw new Error(
        `knowledge destructive dialog close issues: ${closeResult.issues.join(
          ', '
        )}. Details: ${JSON.stringify(closeResult)}`
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
        const expectedNavLabels = ${JSON.stringify(
          check.expectedVisibleNavLabels ?? []
        )};
        const selectors = {
          brand: '.vwb-brand',
          save: '.vwb-save-status',
          dataMenu: '.vwb-header-menu > button'
        };
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight;
        const issues = [];
        const rects = {};
        const visibleNav = Array.from(document.querySelectorAll('.vwb-top-nav'))
          .find((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && rect.width > 0 && rect.height > 0;
          });
        if (!visibleNav) {
          issues.push('nav is missing');
        } else {
          const rect = visibleNav.getBoundingClientRect();
          rects.nav = {
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            width: Math.round(rect.width)
          };
          if (rect.left < 0 || rect.right > viewportWidth) {
            issues.push('nav is clipped horizontally');
          }
          if (rect.top < 0 || rect.bottom > viewportHeight) {
            issues.push('nav is clipped vertically');
          }
          const navLabels = Array.from(visibleNav.querySelectorAll('a'))
            .map((link) => link.textContent.trim());
          if (
            expectedNavLabels.length > 0 &&
            JSON.stringify(navLabels) !== JSON.stringify(expectedNavLabels)
          ) {
            issues.push(
              'nav labels are ' + JSON.stringify(navLabels) +
                ', expected ' + JSON.stringify(expectedNavLabels)
            );
          }
        }
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
    await waitForRuntimeCondition(
      cdp,
      "document.activeElement?.getAttribute('role') === 'menuitem'"
    );
    const menuResult = await evaluateRuntime(
      cdp,
      `(() => {
        const trigger = document.querySelector('.vwb-header-menu > button');
        const menu = document.querySelector('.vwb-header-menu-list');
        const viewportWidth = document.documentElement.clientWidth;
        const issues = [];
        if (trigger?.getAttribute('aria-haspopup') !== 'menu') {
          issues.push('data menu trigger is missing menu popup semantics');
        }
        if (trigger?.getAttribute('aria-expanded') !== 'true') {
          issues.push('data menu trigger did not report expanded state');
        }
        if (!menu) {
          issues.push('data menu list did not open');
          return { issues, rect: null, itemCount: 0 };
        }
        const rect = menu.getBoundingClientRect();
        const itemCount = menu.querySelectorAll('button, a').length;
        const menuItemCount = menu.querySelectorAll('[role="menuitem"]').length;
        if (itemCount < 4) {
          issues.push('data menu has too few actions');
        }
        if (menu.getAttribute('role') !== 'menu') {
          issues.push('data menu list is missing menu role');
        }
        if (menuItemCount !== itemCount) {
          issues.push('data menu actions are missing menuitem roles');
        }
        if (document.activeElement?.getAttribute('role') !== 'menuitem') {
          issues.push('data menu did not focus the first menu item');
        }
        if (rect.left < 0 || rect.right > viewportWidth) {
          issues.push('data menu list is clipped horizontally');
        }
        return {
          issues,
          itemCount,
          menuItemCount,
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
    const menuCloseResult = await evaluateRuntime(
      cdp,
      `(() => {
        const active = document.activeElement;
        active?.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            key: 'Escape'
          })
        );
        return true;
      })()`
    );
    if (!menuCloseResult) {
      throw new Error(`${check.name} menu escape dispatch failed`);
    }
    await waitForRuntimeCondition(
      cdp,
      "!document.querySelector('.vwb-header-menu-list')"
    );
    const menuFocusResult = await evaluateRuntime(
      cdp,
      `(() => {
        const trigger = document.querySelector('.vwb-header-menu > button');
        return {
          isFocused: document.activeElement === trigger,
          expanded: trigger?.getAttribute('aria-expanded') ?? ''
        };
      })()`
    );
    if (!menuFocusResult.isFocused || menuFocusResult.expanded !== 'false') {
      throw new Error(
        `${check.name} menu did not restore trigger focus: ${JSON.stringify(
          menuFocusResult
        )}`
      );
    }
    await evaluateRuntime(
      cdp,
      `(() => {
        const trigger = document.querySelector('.vwb-header-menu > button');
        trigger?.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            key: 'ArrowDown'
          })
        );
        return true;
      })()`
    );
    await waitForRuntimeCondition(
      cdp,
      "document.activeElement?.getAttribute('role') === 'menuitem'"
    );
    const menuArrowResult = await evaluateRuntime(
      cdp,
      `(() => {
        const trigger = document.querySelector('.vwb-header-menu > button');
        return {
          expanded: trigger?.getAttribute('aria-expanded') ?? '',
          focusedRole: document.activeElement?.getAttribute('role') ?? ''
        };
      })()`
    );
    if (
      menuArrowResult.expanded !== 'true' ||
      menuArrowResult.focusedRole !== 'menuitem'
    ) {
      throw new Error(
        `${check.name} menu did not open from ArrowDown: ${JSON.stringify(
          menuArrowResult
        )}`
      );
    }
    const menuNavigationResult = await evaluateRuntime(
      cdp,
      `(() => {
        const menu = document.querySelector('.vwb-header-menu-list');
        const items = Array.from(menu?.querySelectorAll('[role="menuitem"]') ?? []);
        const activeIndex = () => items.indexOf(document.activeElement);
        const dispatchKey = (key) => {
          document.activeElement?.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles: true,
              key
            })
          );
          return activeIndex();
        };
        const startIndex = activeIndex();
        const afterArrowDown = dispatchKey('ArrowDown');
        const afterArrowUp = dispatchKey('ArrowUp');
        const afterEnd = dispatchKey('End');
        const afterHome = dispatchKey('Home');
        return {
          afterArrowDown,
          afterArrowUp,
          afterEnd,
          afterHome,
          itemCount: items.length,
          startIndex
        };
      })()`
    );
    if (
      menuNavigationResult.itemCount < 4 ||
      menuNavigationResult.startIndex !== 0 ||
      menuNavigationResult.afterArrowDown !== 1 ||
      menuNavigationResult.afterArrowUp !== 0 ||
      menuNavigationResult.afterEnd !== menuNavigationResult.itemCount - 1 ||
      menuNavigationResult.afterHome !== 0
    ) {
      throw new Error(
        `${check.name} menu keyboard navigation failed: ${JSON.stringify(
          menuNavigationResult
        )}`
      );
    }
    const didDispatchOutsidePointer = await evaluateRuntime(
      cdp,
      `(() => {
        const outsideTarget = document.querySelector('#main-content') ?? document.body;
        outsideTarget.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            pointerType: 'mouse'
          })
        );
        return true;
      })()`
    );
    if (!didDispatchOutsidePointer) {
      throw new Error(`${check.name} menu outside pointer dispatch failed`);
    }
    await waitForRuntimeCondition(
      cdp,
      "!document.querySelector('.vwb-header-menu-list')"
    );
    const menuOutsideClickResult = await evaluateRuntime(
      cdp,
      `(() => {
        const trigger = document.querySelector('.vwb-header-menu > button');
        return {
          expanded: trigger?.getAttribute('aria-expanded') ?? '',
          isOpen: Boolean(document.querySelector('.vwb-header-menu-list'))
        };
      })()`
    );
    if (
      menuOutsideClickResult.isOpen ||
      menuOutsideClickResult.expanded !== 'false'
    ) {
      throw new Error(
        `${check.name} menu did not close on outside click: ${JSON.stringify(
          menuOutsideClickResult
        )}`
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

  mkdirSync(artifactDir, { recursive: true });
  removePathIfPossible(profileRoot);
  removePathIfPossible(screenshotDir);
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
        await assertRelationshipGraphNodeActions(browserPath, profilePrefix);
        writeLine('layout ok: relationship-graph-node-actions');
        await assertTimelineContextCreateRouteReseeds(
          browserPath,
          profilePrefix
        );
        writeLine('route ok: timeline-context-create-reseed');
        await assertWorkbenchDirtyRouteGuard(browserPath, profilePrefix);
        writeLine('route ok: workbench-dirty-route-guard');
        await assertWorkbenchReviewQueueRoute(browserPath, profilePrefix);
        writeLine('route ok: workbench-review-queue-route');
        await assertKnowledgeDestructiveDialog(browserPath, profilePrefix);
        writeLine('dialog ok: knowledge-destructive-action');
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
