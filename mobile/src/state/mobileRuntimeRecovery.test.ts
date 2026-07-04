import { describe, expect, it } from '@jest/globals';
import { getMobileRuntimeRecoveryCopy } from './mobileRuntimeRecovery';

describe('mobileRuntimeRecovery', () => {
  it('keeps runtime recovery copy local and actionable', () => {
    const copy = getMobileRuntimeRecoveryCopy();

    expect(copy.detail).toContain('on this device');
    expect(copy.backupHint).toContain('export JSON');
    expect(copy.retryLabel).toBe('Retry View');
    expect(copy.dataLabel).toBe('Open Data');
  });

  it('does not expose raw error or remote recovery wording', () => {
    const copy = Object.values(getMobileRuntimeRecoveryCopy()).join(' ');

    expect(copy).not.toMatch(/stack|exception|cloud|account|server/i);
  });
});
