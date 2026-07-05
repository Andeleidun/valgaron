import { describe, expect, it } from '@jest/globals';
import { dataRecoverySnapshotUnavailableMessage } from './dataFeatureModel';
import { getEntryNameCopiedMessage } from './codexEntries';
import { getFeedbackTone } from './feedbackTone';
import { getDeviceCommitResultMessage } from './saveStatus';

describe('feedback tone helpers', () => {
  it('classifies validation and storage failures as danger', () => {
    expect(getFeedbackTone('Name is required.')).toBe('danger');
    expect(getFeedbackTone('Choose an existing source entry.')).toBe('danger');
    expect(getFeedbackTone('Could not save the recovery snapshot.')).toBe(
      'danger'
    );
    expect(getFeedbackTone(dataRecoverySnapshotUnavailableMessage)).toBe(
      'danger'
    );
    expect(getFeedbackTone('This is not valid JSON.')).toBe('danger');
  });

  it('classifies recoverable warnings and successful local actions', () => {
    expect(getFeedbackTone('Export text has local edits.')).toBe('warning');
    expect(
      getFeedbackTone('Create at least two entries before adding links.')
    ).toBe('warning');
    expect(getFeedbackTone('Sharing is unavailable here.')).toBe('warning');
    expect(getFeedbackTone('Imported backup on this device.')).toBe('success');
    expect(getFeedbackTone('Deleted the selected recovery snapshot.')).toBe(
      'success'
    );
    expect(getFeedbackTone(getDeviceCommitResultMessage('entry-saved'))).toBe(
      'success'
    );
    expect(
      getFeedbackTone(getDeviceCommitResultMessage('workspace-updated'))
    ).toBe('success');
    expect(getFeedbackTone(getEntryNameCopiedMessage('Mira Rowan'))).toBe(
      'success'
    );
  });
});
