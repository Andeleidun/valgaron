import type { WorldCodex, WorldDocument } from '../types';
import {
  createFallbackWorldDocument,
  getActiveWorld,
  parseWorldDocument,
} from './worldDocument';

export const CODEX_STORAGE_KEY = 'valgaron.worldDocument.v2';
export const LEGACY_CODEX_STORAGE_KEY = 'valgaron.worldCodex.v1';

function readStoredValues(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    return [CODEX_STORAGE_KEY, LEGACY_CODEX_STORAGE_KEY]
      .map((key) => window.localStorage.getItem(key))
      .filter((value): value is string => value !== null);
  } catch {
    return [];
  }
}

export function loadWorldDocument(): WorldDocument {
  for (const storedValue of readStoredValues()) {
    try {
      const parsedValue: unknown = JSON.parse(storedValue);
      const document = parseWorldDocument(parsedValue);
      if (document) {
        return document;
      }
    } catch {
      // Try the next known storage key before falling back to seed data.
    }
  }
  return createFallbackWorldDocument();
}

export function saveWorldDocument(document: WorldDocument): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    window.localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(document));
    return true;
  } catch {
    return false;
  }
}

/** Create a fresh seed document; callers save it through the normal save path. */
export function resetWorldDocumentStorage(): WorldDocument {
  return createFallbackWorldDocument();
}

export function loadCodex(): WorldCodex {
  return getActiveWorld(loadWorldDocument()).codex;
}

export function saveCodex(codex: WorldCodex): boolean {
  const document = loadWorldDocument();
  const activeWorld = getActiveWorld(document);
  return saveWorldDocument({
    ...document,
    worlds: document.worlds.map((world) =>
      world.id === activeWorld.id ? { ...world, codex } : world
    ),
    savedAt: new Date().toISOString(),
  });
}

/** Create a fresh seed codex for compatibility with the earlier codex helper API. */
export function resetCodexStorage(): WorldCodex {
  return getActiveWorld(resetWorldDocumentStorage()).codex;
}
