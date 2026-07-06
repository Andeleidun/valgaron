import { describe, expect, it } from '@jest/globals';
import { formatUpdatedAt } from './codexEntries';
import {
  getDeviceCommitPendingMessage,
  getDeviceCommitResolvedMessage,
  getDeviceCommitResultMessage,
  getDeviceSaveStatusModel,
  getLocalSaveStatusModel,
} from './saveStatus';
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

  it('builds shared browser manual save status labels and details', () => {
    const savedAt = '2026-06-01T09:00:00.000Z';

    expect(
      getLocalSaveStatusModel({
        savedAt,
        state: 'saved',
      })
    ).toEqual({
      label: 'Saved',
      detail: `Last save attempt: ${formatUpdatedAt(savedAt)}.`,
      tone: 'success',
    });
    expect(
      getLocalSaveStatusModel({
        savedAt,
        state: 'paused',
      })
    ).toEqual({
      label: 'Save Paused',
      detail: `Manual save paused after local storage recovery: ${formatUpdatedAt(
        savedAt
      )}.`,
      tone: 'danger',
    });
    expect(
      getLocalSaveStatusModel({
        savedAt,
        state: 'unsaved',
        targetLabel: 'localStorage',
      })
    ).toEqual({
      label: 'Needs Save',
      detail: `This document is loaded in the session but has not been saved to current localStorage yet. Last document timestamp: ${formatUpdatedAt(
        savedAt
      )}.`,
      tone: 'warning',
    });
    expect(
      getLocalSaveStatusModel({
        savedAt,
        state: 'dirty',
      }).label
    ).toBe('Unsaved');
    expect(
      getLocalSaveStatusModel({
        savedAt,
        state: 'failed',
      }).label
    ).toBe('Save Failed');
  });

  it('builds pending commit feedback only when a success message is expected', () => {
    expect(getDeviceCommitPendingMessage('Saved entry on this device.')).toBe(
      localPersistenceCopy.deviceSaving
    );
    expect(getDeviceCommitPendingMessage('')).toBe('');
  });

  it('resolves device commit feedback after persistence completes', () => {
    expect(
      getDeviceCommitResolvedMessage({
        currentFormMessage: localPersistenceCopy.deviceSaving,
        didSave: true,
        savedFormMessage: 'Saved entry on this device.',
      })
    ).toBe('Saved entry on this device.');
    expect(
      getDeviceCommitResolvedMessage({
        currentFormMessage: localPersistenceCopy.deviceSaving,
        didSave: false,
        savedFormMessage: 'Saved entry on this device.',
      })
    ).toBe(localPersistenceCopy.deviceSaveFailed);
  });

  it('does not hide blocking failures behind success feedback', () => {
    const blockingFailureMessage =
      'Could not save the recovery snapshot to this device.';

    expect(
      getDeviceCommitResolvedMessage({
        blockingFailureMessage,
        currentFormMessage: blockingFailureMessage,
        didSave: true,
        savedFormMessage: 'Imported backup on this device.',
      })
    ).toBe(blockingFailureMessage);
  });

  it('centralizes device commit result messages', () => {
    expect(getDeviceCommitResultMessage('entry-saved')).toBe(
      'Saved entry on this device.'
    );
    expect(getDeviceCommitResultMessage('relationship-updated')).toBe(
      'Updated relationship on this device.'
    );
    expect(getDeviceCommitResultMessage('planetary-world-saved')).toBe(
      'Saved in-fiction world on this device.'
    );
    expect(getDeviceCommitResultMessage('entry-type-updated')).toBe(
      'Updated entry type on this device.'
    );
  });
});
