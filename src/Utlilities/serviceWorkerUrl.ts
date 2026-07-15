export function getServiceWorkerUrl(
  baseUrl: string,
  deployVersion: string | undefined
): string {
  const version = deployVersion?.trim() || 'local-build';
  return `${baseUrl}sw.js?version=${encodeURIComponent(version)}`;
}
