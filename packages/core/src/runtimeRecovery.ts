export type RuntimeRecoveryCopy = {
  kicker: string;
  title: string;
  detail: string;
  retryLabel: string;
  dataLabel: string;
  reloadLabel: string;
  backupHint: string;
  diagnosticsTitle: string;
  diagnosticsDescription: string;
  diagnosticsTextAreaLabel: string;
  downloadDiagnosticsLabel: string;
  diagnosticsDownloadedMessage: string;
  diagnosticsUnavailableMessage: string;
};

export const runtimeRecoveryCopy: RuntimeRecoveryCopy = {
  kicker: 'Recovery',
  title: 'Something went wrong',
  detail:
    'The app caught a rendering failure before the page went blank. Your local document was not deleted by this recovery screen.',
  retryLabel: 'Retry',
  dataLabel: 'Open Data',
  reloadLabel: 'Reload App',
  backupHint:
    'Use Data to export JSON, restore a recovery snapshot, import a backup, or reset to starter data.',
  diagnosticsTitle: 'Diagnostics',
  diagnosticsDescription:
    'This report excludes world names, entry names, notes, summaries, tags, and ids by default.',
  diagnosticsTextAreaLabel: 'Runtime diagnostics JSON',
  downloadDiagnosticsLabel: 'Download Diagnostics',
  diagnosticsDownloadedMessage: 'Diagnostics downloaded.',
  diagnosticsUnavailableMessage:
    'Download is unavailable in this runtime; copy the diagnostics text instead.',
};

export function getRuntimeRecoveryCopy(): RuntimeRecoveryCopy {
  return runtimeRecoveryCopy;
}
