import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument, valgaronProduct } from '@valgaron/core';
import {
  getMobileExportDraftState,
  getMobileExportSharePayload,
  getMobileExportText,
  getMobileImportPreviewText,
  getMobileImportReviewState,
  getNextMobileVisibleExportText,
  mobileExportOptions,
  type MobileExportMode,
} from './mobileDataExport';

describe('mobile data export view model', () => {
  it('offers the same export choices as the web data workflow', () => {
    expect(mobileExportOptions.map((option) => option.label)).toEqual([
      'Full JSON',
      'Active JSON',
      'Markdown',
      'Diagnostics',
    ]);
  });

  it.each<MobileExportMode>([
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

  it('builds native share payloads from the visible export text', () => {
    expect(getMobileExportSharePayload('active-json', '{"worlds":[]}')).toEqual(
      {
        title: `${valgaronProduct.name} active workspace JSON backup`,
        message: '{"worlds":[]}',
      }
    );
  });

  it('flags edited or empty visible export text before sharing', () => {
    expect(getMobileExportDraftState('generated', 'generated')).toEqual({
      canShare: true,
      isEdited: false,
      statusMessage: '',
    });
    expect(getMobileExportDraftState('generated', 'changed')).toMatchObject({
      canShare: true,
      isEdited: true,
    });
    expect(getMobileExportDraftState('generated', '   ')).toMatchObject({
      canShare: false,
      isEdited: true,
    });
  });

  it('keeps local export edits when generated export text changes', () => {
    expect(
      getNextMobileVisibleExportText({
        currentGeneratedText: 'old generated',
        nextGeneratedText: 'new generated',
        visibleText: 'old generated',
      })
    ).toBe('new generated');
    expect(
      getNextMobileVisibleExportText({
        currentGeneratedText: 'old generated',
        nextGeneratedText: 'new generated',
        visibleText: 'local edit',
      })
    ).toBe('local edit');
  });

  it('formats import previews with the same review details as web', () => {
    const previewText = getMobileImportPreviewText({
      activeWorldName: 'Sample Atlas',
      worldCount: 1,
      planetaryWorldCount: 1,
      entryCount: 10,
      relationshipCount: 5,
      savedAt: '2026-06-01T09:00:00.000Z',
    });

    expect(previewText.title).toBe('Sample Atlas');
    expect(previewText.detail).toContain(
      '1 workspace(s), 10 entries, 5 relationships.'
    );
    expect(previewText.detail).toContain('Jun 1, 2026');
  });

  it('derives import review state from the current parsed text', () => {
    expect(getMobileImportReviewState('', null)).toEqual({
      canImport: false,
      error: '',
      previewText: null,
    });

    expect(
      getMobileImportReviewState('not json', {
        ok: false,
        error: 'This is not valid JSON.',
      })
    ).toEqual({
      canImport: false,
      error: 'This is not valid JSON.',
      previewText: null,
    });

    const document = createSeedWorldDocument();
    expect(
      getMobileImportReviewState(JSON.stringify(document), {
        ok: true,
        document,
        preview: {
          activeWorldName: 'Sample Atlas',
          worldCount: 1,
          planetaryWorldCount: 1,
          entryCount: 10,
          relationshipCount: 5,
          savedAt: '2026-06-01T09:00:00.000Z',
        },
      })
    ).toMatchObject({
      canImport: true,
      error: '',
      previewText: { title: 'Sample Atlas' },
    });
  });
});
