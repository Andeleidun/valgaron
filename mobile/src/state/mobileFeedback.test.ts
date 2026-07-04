import { describe, expect, it } from '@jest/globals';
import { getMobileFeedbackTone } from './mobileFeedback';

describe('mobile feedback tone', () => {
  it('classifies validation and storage failures as danger', () => {
    expect(getMobileFeedbackTone('Name is required.')).toBe('danger');
    expect(getMobileFeedbackTone('Choose an existing source entry.')).toBe(
      'danger'
    );
    expect(getMobileFeedbackTone('Could not save the recovery snapshot.')).toBe(
      'danger'
    );
    expect(
      getMobileFeedbackTone('No recovery snapshot is available on this device.')
    ).toBe('danger');
    expect(getMobileFeedbackTone('This is not valid JSON.')).toBe('danger');
  });

  it('classifies recoverable warnings and successful local actions', () => {
    expect(getMobileFeedbackTone('Export text has local edits.')).toBe(
      'warning'
    );
    expect(
      getMobileFeedbackTone('Create at least two entries before adding links.')
    ).toBe('warning');
    expect(getMobileFeedbackTone('Sharing is unavailable here.')).toBe(
      'warning'
    );
    expect(getMobileFeedbackTone('Imported backup on this device.')).toBe(
      'success'
    );
    expect(
      getMobileFeedbackTone('Deleted the selected recovery snapshot.')
    ).toBe('success');
    expect(getMobileFeedbackTone('Saved entry on this device.')).toBe(
      'success'
    );
    expect(getMobileFeedbackTone('Updated workspace on this device.')).toBe(
      'success'
    );
  });
});
