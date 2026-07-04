type RandomUuidProvider = {
  randomUUID?: () => string;
};

function getRandomUuidProvider(): RandomUuidProvider | null {
  const globalScope = globalThis as typeof globalThis & {
    crypto?: RandomUuidProvider;
  };
  return globalScope.crypto ?? null;
}

export function makeLocalIdSuffix(now: () => number = Date.now): string {
  const provider = getRandomUuidProvider();
  return typeof provider?.randomUUID === 'function'
    ? provider.randomUUID().slice(0, 8)
    : String(now());
}
