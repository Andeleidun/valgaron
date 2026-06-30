export type StringStorageAdapter = {
  read: (key: string) => string | null;
  readResult: (key: string) => StorageReadResult;
  write: (key: string, value: string) => boolean;
};

export type StorageReadResult =
  | {
      ok: true;
      value: string | null;
    }
  | {
      ok: false;
      errorMessage: string;
    };

export const browserLocalStorageAdapter: StringStorageAdapter = {
  read(key) {
    const result = this.readResult(key);
    return result.ok ? result.value : null;
  },
  readResult(key) {
    if (typeof window === 'undefined') {
      return {
        ok: false,
        errorMessage: 'Browser localStorage is unavailable.',
      };
    }
    try {
      return {
        ok: true,
        value: window.localStorage.getItem(key),
      };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Browser localStorage could not be read.',
      };
    }
  },
  write(key, value) {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};
