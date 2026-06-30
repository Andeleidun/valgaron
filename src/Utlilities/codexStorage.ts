import type {
  CharacterEntry,
  FactionEntry,
  LoreEntry,
  PlaceEntry,
  TimelineEntry,
  WorldCodex,
  WorldEntryBase,
} from '../types';
import { createSeedCodex } from './seedCodex';

export const CODEX_STORAGE_KEY = 'valgaron.worldCodex.v1';

type StoredBase = Omit<WorldEntryBase, 'kind'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function readTags(record: Record<string, unknown>): string[] | null {
  const value = record.tags;
  if (!Array.isArray(value) || !value.every((tag) => typeof tag === 'string')) {
    return null;
  }
  return value;
}

function readBase(record: Record<string, unknown>): StoredBase | null {
  const id = readString(record, 'id');
  const name = readString(record, 'name');
  const summary = readString(record, 'summary');
  const updatedAt = readString(record, 'updatedAt');
  const tags = readTags(record);
  const hasValidUpdatedAt =
    typeof updatedAt === 'string' && Number.isFinite(Date.parse(updatedAt));
  if (!id || !name || summary === null || !hasValidUpdatedAt || tags === null) {
    return null;
  }
  return { id, name, summary, tags, updatedAt };
}

function parseCharacter(value: unknown): CharacterEntry | null {
  if (!isRecord(value) || value.kind !== 'character') {
    return null;
  }
  const base = readBase(value);
  const role = readString(value, 'role');
  const home = readString(value, 'home');
  const affiliation = readString(value, 'affiliation');
  const status = readString(value, 'status');
  if (
    !base ||
    role === null ||
    home === null ||
    affiliation === null ||
    status === null
  ) {
    return null;
  }
  return { ...base, kind: 'character', role, home, affiliation, status };
}

function parsePlace(value: unknown): PlaceEntry | null {
  if (!isRecord(value) || value.kind !== 'place') {
    return null;
  }
  const base = readBase(value);
  const region = readString(value, 'region');
  const climate = readString(value, 'climate');
  const significance = readString(value, 'significance');
  if (!base || region === null || climate === null || significance === null) {
    return null;
  }
  return { ...base, kind: 'place', region, climate, significance };
}

function parseFaction(value: unknown): FactionEntry | null {
  if (!isRecord(value) || value.kind !== 'faction') {
    return null;
  }
  const base = readBase(value);
  const purpose = readString(value, 'purpose');
  const influence = readString(value, 'influence');
  const headquarters = readString(value, 'headquarters');
  if (
    !base ||
    purpose === null ||
    influence === null ||
    headquarters === null
  ) {
    return null;
  }
  return { ...base, kind: 'faction', purpose, influence, headquarters };
}

function parseLore(value: unknown): LoreEntry | null {
  if (!isRecord(value) || value.kind !== 'lore') {
    return null;
  }
  const base = readBase(value);
  const category = readString(value, 'category');
  const source = readString(value, 'source');
  const implications = readString(value, 'implications');
  if (!base || category === null || source === null || implications === null) {
    return null;
  }
  return { ...base, kind: 'lore', category, source, implications };
}

function parseTimeline(value: unknown): TimelineEntry | null {
  if (!isRecord(value) || value.kind !== 'timeline') {
    return null;
  }
  const base = readBase(value);
  const dateLabel = readString(value, 'dateLabel');
  const era = readString(value, 'era');
  const consequences = readString(value, 'consequences');
  if (!base || dateLabel === null || era === null || consequences === null) {
    return null;
  }
  return { ...base, kind: 'timeline', dateLabel, era, consequences };
}

function parseArray<TEntry>(
  value: unknown,
  parseEntry: (entry: unknown) => TEntry | null
): TEntry[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const entries = value.map(parseEntry);
  if (entries.some((entry) => entry === null)) {
    return null;
  }
  return entries.filter((entry): entry is TEntry => entry !== null);
}

function parseCodex(value: unknown): WorldCodex | null {
  if (!isRecord(value)) {
    return null;
  }
  const characters = parseArray(value.characters, parseCharacter);
  const places = parseArray(value.places, parsePlace);
  const factions = parseArray(value.factions, parseFaction);
  const lore = parseArray(value.lore, parseLore);
  const timeline = parseArray(value.timeline, parseTimeline);
  if (!characters || !places || !factions || !lore || !timeline) {
    return null;
  }
  return { characters, places, factions, lore, timeline };
}

export function loadCodex(): WorldCodex {
  if (typeof window === 'undefined') {
    return createSeedCodex();
  }
  let storedValue: string | null;
  try {
    storedValue = window.localStorage.getItem(CODEX_STORAGE_KEY);
  } catch {
    return createSeedCodex();
  }
  if (!storedValue) {
    return createSeedCodex();
  }
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return parseCodex(parsedValue) ?? createSeedCodex();
  } catch {
    return createSeedCodex();
  }
}

export function saveCodex(codex: WorldCodex): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    window.localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(codex));
    return true;
  } catch {
    return false;
  }
}

export function resetCodexStorage(): WorldCodex {
  const seedCodex = createSeedCodex();
  saveCodex(seedCodex);
  return seedCodex;
}
