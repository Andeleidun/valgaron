/** Create a conservative file basename from user-visible world names. */
export function slugFilename(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'world'
  );
}

/** Trigger a browser text download when DOM blob APIs are available. */
export function downloadTextFile(filename: string, text: string): boolean {
  if (
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined'
  ) {
    return false;
  }
  const url = URL.createObjectURL(
    new Blob([text], { type: 'text/plain;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

export function downloadBinaryFile(
  filename: string,
  bytes: Uint8Array,
  mediaType: string
): boolean {
  if (
    typeof document === 'undefined' ||
    typeof Blob === 'undefined' ||
    typeof URL === 'undefined'
  ) {
    return false;
  }
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: mediaType })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
