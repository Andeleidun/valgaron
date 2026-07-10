const { spawnSync } = require('node:child_process');

const knownExpoCliAuditFinding = new Set([
  '@expo/cli',
  '@expo/config',
  '@expo/config-plugins',
  '@expo/local-build-cache-provider',
  '@expo/metro-config',
  '@expo/prebuild-config',
  'expo',
  'expo-sharing',
  'uuid',
  'xcode',
]);

function writeLine(message) {
  process.stdout.write(`${message}\n`);
}

function writeError(message) {
  process.stderr.write(`${message}\n`);
}

function isKnownExpoCliFinding([name, vulnerability]) {
  if (!knownExpoCliAuditFinding.has(name)) {
    return false;
  }
  if (vulnerability.severity !== 'moderate') {
    return false;
  }
  const fixAvailable = vulnerability.fixAvailable;
  if (fixAvailable === true) {
    return name === '@expo/prebuild-config';
  }
  if (
    fixAvailable &&
    fixAvailable.name === 'expo-sharing' &&
    fixAvailable.version === '14.0.8' &&
    fixAvailable.isSemVerMajor === true
  ) {
    return true;
  }
  return (
    fixAvailable &&
    fixAvailable.name === 'expo' &&
    fixAvailable.version === '46.0.21' &&
    fixAvailable.isSemVerMajor === true
  );
}

const npmAuditArgs = ['audit', '--omit=dev', '--json'];
const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  writeError('npm_execpath is unavailable; run this check through npm.');
  process.exit(1);
}
const auditCommand = process.execPath;
const auditArgs = [npmCliPath, ...npmAuditArgs];
const result = spawnSync(auditCommand, auditArgs, {
  encoding: 'utf8',
});

if (result.error) {
  throw result.error;
}

const output = result.stdout.trim();
if (!output) {
  writeError(result.stderr.trim() || 'npm audit did not return JSON output.');
  process.exit(1);
}

let auditReport;
try {
  auditReport = JSON.parse(output);
} catch (error) {
  writeError(`Could not parse npm audit JSON: ${error.message}`);
  writeError(output);
  process.exit(1);
}

if (auditReport.error) {
  writeError(
    `npm audit failed: ${auditReport.error.summary ?? 'unknown error'}`
  );
  if (auditReport.error.detail) {
    writeError(auditReport.error.detail);
  }
  process.exit(1);
}

const vulnerabilities = Object.entries(auditReport.vulnerabilities ?? {});
if (result.status !== 0 && vulnerabilities.length === 0) {
  writeError(
    result.stderr.trim() ||
      `npm audit exited with status ${result.status} without vulnerability data.`
  );
  process.exit(1);
}

const unknownFindings = vulnerabilities.filter(
  (entry) => !isKnownExpoCliFinding(entry)
);

if (unknownFindings.length > 0) {
  writeError('Runtime audit found unreviewed vulnerabilities:');
  for (const [name, vulnerability] of unknownFindings) {
    writeError(`- ${name}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

if (vulnerabilities.length === 0) {
  writeLine('Runtime audit passed with no vulnerabilities.');
} else {
  writeLine(
    `Runtime audit found only the reviewed Expo CLI/config tooling finding (${vulnerabilities.length} entries).`
  );
}
