export type MobileRuntimeRecoveryCopy = {
  title: string;
  detail: string;
  retryLabel: string;
  dataLabel: string;
  backupHint: string;
};

export const mobileRuntimeRecoveryCopy: MobileRuntimeRecoveryCopy = {
  title: 'Codex view interrupted',
  detail:
    'The mobile codex hit a rendering problem. Your world document remains on this device unless storage itself fails.',
  retryLabel: 'Retry View',
  dataLabel: 'Open Data',
  backupHint:
    'Use Data to export JSON, restore a recovery snapshot, import a backup, or reset to starter data.',
};

export function getMobileRuntimeRecoveryCopy(): MobileRuntimeRecoveryCopy {
  return mobileRuntimeRecoveryCopy;
}
