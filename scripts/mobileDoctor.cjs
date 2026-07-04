const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const rootDir = process.cwd();
const doctorBin = join(
  rootDir,
  'node_modules',
  'expo-doctor',
  'bin',
  'expo-doctor.js'
);

const result = spawnSync(process.execPath, [doctorBin], {
  cwd: join(rootDir, 'mobile'),
  env: {
    ...process.env,
    EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK: '0',
    EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS: '1',
  },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
