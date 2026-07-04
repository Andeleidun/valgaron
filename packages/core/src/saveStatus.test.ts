import { describe, expect, it } from '@jest/globals';
import { formatUpdatedAt } from './codexEntries';
import { getDeviceSaveStatusModel } from './saveStatus';
import { localPersistenceCopy } from './shell';

describe('save status models', () => {
  it('builds a recognizable mobile device save status affordance', () => {
    expect(
      getDeviceSaveStatusModel({
        savedAt: '2026-06-01T09:00:00.000Z',
        saveMessage: localPersistenceCopy.deviceSaved,
      })
    ).toEqual({
      title: 'Save Status',
      label: localPersistenceCopy.deviceSaved,
      detail: `Document timestamp on this device: ${formatUpdatedAt(
        '2026-06-01T09:00:00.000Z'
      )}.`,
      tone: 'success',
    });
  });

  it('marks in-progress and failed device saves distinctly', () => {
    expect(
      getDeviceSaveStatusModel({
        savedAt: '2026-06-01T09:00:00.000Z',
        saveMessage: localPersistenceCopy.deviceSaving,
      }).tone
    ).toBe('warning');
    expect(
      getDeviceSaveStatusModel({
        savedAt: '2026-06-01T09:00:00.000Z',
        saveMessage: localPersistenceCopy.deviceSaveFailed,
      }).tone
    ).toBe('danger');
  });
});
