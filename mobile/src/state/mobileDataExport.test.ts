import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument, type DataExportMode } from '@valgaron/core';
import { getMobileExportText } from './mobileDataExport';

describe('mobile data export view model', () => {
  it.each<DataExportMode>([
    'full-json',
    'active-json',
    'markdown',
    'diagnostics',
  ])('builds export text for %s', (mode) => {
    const text = getMobileExportText(createSeedWorldDocument(), mode);

    expect(text).toContain(
      mode === 'markdown'
        ? '# Sample Atlas'
        : mode === 'diagnostics'
        ? '"workspaceCount"'
        : '"worlds"'
    );
  });

  it('omits world content from diagnostics export', () => {
    const text = getMobileExportText(createSeedWorldDocument(), 'diagnostics', {
      lastRecoverySnapshot: {
        createdAt: '2026-06-01T00:00:00.000Z',
        document: createSeedWorldDocument(),
        id: 'snapshot-1',
        reason: 'import',
      },
      loadStatus: {
        checkedAt: '2026-06-01T00:00:00.000Z',
        message: 'Loaded saved data.',
        source: 'saved',
      },
      saveMessage: 'Saved to this device.',
    });

    expect(text).toContain('"includesWorldContent": false');
    expect(text).toContain('"loadState": "saved"');
    expect(text).toContain('"saveState": "Saved to this device."');
    expect(text).toContain('"recoverySnapshotAvailable": true');
    expect(text).toContain('"recoverySnapshotReason": "import"');
    expect(text).not.toContain('Sample Atlas');
    expect(text).not.toContain('Mira Rowan');
  });

  it('exports readable relationship names in mobile Markdown', () => {
    const text = getMobileExportText(createSeedWorldDocument(), 'markdown');

    expect(text).toContain('Mira Rowan member of The Cartographers Guild');
  });
});
