import {
  createFallbackWorldDocument,
  parseWorldDocument,
  type WorldDocument,
} from '@valgaron/core';
import { browserLocalStorageAdapter } from './storageAdapter';

export const CODEX_STORAGE_KEY = 'valgaron.worldDocument.v4';
export const LEGACY_CODEX_STORAGE_KEY = 'valgaron.worldDocument.v3';

type StoredDocumentSource = 'current' | 'legacy-v3' | 'seed';

type StoredValueResult =
  | {
      ok: true;
      key: string;
      source: Exclude<StoredDocumentSource, 'seed'>;
      value: string | null;
    }
  | {
      ok: false;
      key: string;
      source: Exclude<StoredDocumentSource, 'seed'>;
      issue: string;
    };

export type WorldDocumentLoadStatus = {
  state: 'loaded' | 'empty' | 'recovered';
  source: StoredDocumentSource;
  message: string;
  issues: readonly string[];
  checkedAt: string;
};

export type WorldDocumentLoadResult = {
  document: WorldDocument;
  status: WorldDocumentLoadStatus;
};

const storedDocumentKeys: readonly {
  key: string;
  source: Exclude<StoredDocumentSource, 'seed'>;
  label: string;
}[] = [
  {
    key: CODEX_STORAGE_KEY,
    source: 'current',
    label: 'current saved document',
  },
  {
    key: LEGACY_CODEX_STORAGE_KEY,
    source: 'legacy-v3',
    label: 'legacy schema 3 saved document',
  },
];

function readStoredValues(): StoredValueResult[] {
  return storedDocumentKeys.map(({ key, source, label }) => {
    const result = browserLocalStorageAdapter.readResult(key);
    return result.ok
      ? {
          ok: true,
          key,
          source,
          value: result.value,
        }
      : {
          ok: false,
          key,
          source,
          issue: `${label} could not be read: ${result.errorMessage}`,
        };
  });
}

export function loadWorldDocument(): WorldDocument {
  return loadWorldDocumentWithStatus().document;
}

/** Load the world document and explain whether fallback or recovery was needed. */
export function loadWorldDocumentWithStatus(): WorldDocumentLoadResult {
  const issues: string[] = [];
  let foundStoredValue = false;
  for (const storedResult of readStoredValues()) {
    if (!storedResult.ok) {
      issues.push(storedResult.issue);
      if (storedResult.source === 'current') {
        break;
      }
      continue;
    }
    if (storedResult.value === null) {
      continue;
    }
    foundStoredValue = true;
    try {
      const parsedValue: unknown = JSON.parse(storedResult.value);
      const document = parseWorldDocument(parsedValue);
      if (document) {
        const recovered = issues.length > 0;
        const migrated = storedResult.source === 'legacy-v3';
        return {
          document,
          status: {
            state: recovered ? 'recovered' : 'loaded',
            source: storedResult.source,
            message: migrated
              ? 'Loaded and migrated the schema 3 local world document. Save to persist schema 4; the schema 3 value remains available until then.'
              : recovered
              ? 'Loaded a recoverable saved document after another local storage source failed.'
              : 'Loaded the saved local world document.',
            issues,
            checkedAt: new Date().toISOString(),
          },
        };
      }
      issues.push(`${storedResult.key} did not match the current schema.`);
    } catch {
      issues.push(`${storedResult.key} is not valid JSON.`);
    }
  }
  const document = createFallbackWorldDocument();
  const state = foundStoredValue || issues.length > 0 ? 'recovered' : 'empty';
  return {
    document,
    status: {
      state,
      source: 'seed',
      message:
        state === 'empty'
          ? 'No saved local world document was found, so starter data was loaded.'
          : 'Saved local data could not be used, so starter data was loaded. Export this document before making risky changes if you need to preserve it.',
      issues,
      checkedAt: new Date().toISOString(),
    },
  };
}

export function saveWorldDocument(document: WorldDocument): boolean {
  return browserLocalStorageAdapter.write(
    CODEX_STORAGE_KEY,
    JSON.stringify(document)
  );
}

/** Create a fresh seed document; callers save it through the normal save path. */
export function resetWorldDocumentStorage(): WorldDocument {
  return createFallbackWorldDocument();
}
