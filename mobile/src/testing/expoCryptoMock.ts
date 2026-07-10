export const CryptoDigestAlgorithm = { SHA256: 'SHA256' } as const;

export async function digest(): Promise<ArrayBuffer> {
  return new ArrayBuffer(32);
}

export function randomUUID(): string {
  return 'mock-image-asset';
}
