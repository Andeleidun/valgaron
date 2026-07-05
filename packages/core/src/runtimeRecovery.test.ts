import { describe, expect, it } from '@jest/globals';
import { getRuntimeRecoveryCopy } from './runtimeRecovery';

describe('runtime recovery model', () => {
  it('keeps recovery copy local, actionable, and platform-neutral', () => {
    const copy = getRuntimeRecoveryCopy();

    expect(copy.title).toBe('Something went wrong');
    expect(copy.detail).toContain('local document');
    expect(copy.backupHint).toContain('export JSON');
    expect(copy.retryLabel).toBe('Retry');
    expect(copy.dataLabel).toBe('Open Data');
    expect(copy.downloadDiagnosticsLabel).toBe('Download Diagnostics');
  });

  it('does not introduce raw error or remote recovery wording', () => {
    const copy = Object.values(getRuntimeRecoveryCopy()).join(' ');

    expect(copy).not.toMatch(/stack|exception|cloud|account|server/i);
  });
});
