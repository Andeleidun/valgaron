import { describe, expect, it } from '@jest/globals';
import {
  createMemoryStringStorage,
  loadJsonValue,
  parseJsonValue,
  saveJsonValue,
} from './index';

type NamedRecord = {
  name: string;
};

function parseNamedRecord(value: unknown): NamedRecord | null {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { name?: unknown }).name === 'string'
    ? { name: (value as { name: string }).name }
    : null;
}

describe('platform storage helpers', () => {
  it('parses valid JSON through a narrow value parser', () => {
    expect(
      parseJsonValue('{"name":"Aster"}', parseNamedRecord, 'Invalid record.')
    ).toEqual({ ok: true, value: { name: 'Aster' } });
  });

  it('reports invalid JSON and invalid shapes without throwing', () => {
    expect(parseJsonValue('{', parseNamedRecord, 'Invalid record.')).toEqual({
      ok: false,
      error: 'This is not valid JSON.',
    });
    expect(parseJsonValue('42', parseNamedRecord, 'Invalid record.')).toEqual({
      ok: false,
      error: 'Invalid record.',
    });
  });

  it('loads and saves JSON through an async string adapter', async () => {
    const storage = createMemoryStringStorage();

    await expect(
      loadJsonValue(storage, 'world', parseNamedRecord, 'Invalid record.')
    ).resolves.toEqual({ ok: true, value: null });

    await expect(
      saveJsonValue(storage, 'world', { name: 'Aster' })
    ).resolves.toBe(true);

    await expect(
      loadJsonValue(storage, 'world', parseNamedRecord, 'Invalid record.')
    ).resolves.toEqual({ ok: true, value: { name: 'Aster' } });
  });
});
