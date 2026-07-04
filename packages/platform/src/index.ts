export type AsyncStringStorageAdapter = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
};

export type JsonParseResult<TValue> =
  | {
      ok: true;
      value: TValue;
    }
  | {
      ok: false;
      error: string;
    };

export type JsonStorageLoadResult<TValue> =
  | {
      ok: true;
      value: TValue | null;
    }
  | {
      ok: false;
      error: string;
    };

export function parseJsonValue<TValue>(
  text: string,
  parseValue: (value: unknown) => TValue | null,
  invalidMessage: string
): JsonParseResult<TValue> {
  try {
    const parsedValue: unknown = JSON.parse(text);
    const value = parseValue(parsedValue);
    return value ? { ok: true, value } : { ok: false, error: invalidMessage };
  } catch {
    return { ok: false, error: 'This is not valid JSON.' };
  }
}

export async function loadJsonValue<TValue>(
  storage: AsyncStringStorageAdapter,
  key: string,
  parseValue: (value: unknown) => TValue | null,
  invalidMessage: string
): Promise<JsonStorageLoadResult<TValue>> {
  const storedValue = await storage.read(key);
  if (storedValue === null) {
    return { ok: true, value: null };
  }
  const parsed = parseJsonValue(storedValue, parseValue, invalidMessage);
  return parsed.ok ? { ok: true, value: parsed.value } : parsed;
}

export async function saveJsonValue<TValue>(
  storage: AsyncStringStorageAdapter,
  key: string,
  value: TValue
): Promise<boolean> {
  return storage.write(key, JSON.stringify(value));
}

export function createMemoryStringStorage(
  seed: Readonly<Record<string, string>> = {}
): AsyncStringStorageAdapter & {
  snapshot: () => Record<string, string>;
} {
  const values = new Map(Object.entries(seed));
  return {
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
      return true;
    },
    async remove(key) {
      values.delete(key);
      return true;
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}
