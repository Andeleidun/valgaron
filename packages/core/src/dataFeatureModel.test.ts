import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import { valgaronProduct } from './shell';
import {
  dataExportCopy,
  dataExportOptions,
  dataImportCopy,
  dataResetCopy,
  getDataExportDraftState,
  getDataExportSharePayload,
  getDataExportText,
  getDataImportPreviewText,
  getDataImportReviewState,
  getDataRecoverySnapshotModel,
  getDataStorageStatusModel,
  getNextVisibleExportText,
  type DataExportMode,
} from './dataFeatureModel';
import { isCodexExportMode } from './codexDataPortability';

describe('data feature model', () => {
  it('offers the same export choices on shared data surfaces', () => {
    expect(dataExportOptions.map((option) => option.label)).toEqual([
      'Full JSON',
      'Active JSON',
      'Markdown',
      'Diagnostics',
    ]);
    expect(isCodexExportMode('full-json')).toBe(true);
    expect(isCodexExportMode('markdown')).toBe(true);
    expect(isCodexExportMode('unknown')).toBe(false);
  });

  it.each<DataExportMode>([
    'full-json',
    'active-json',
    'markdown',
    'diagnostics',
  ])('builds export text for %s', (mode) => {
    const text = getDataExportText(createSeedWorldDocument(), mode);

    expect(text).toContain(
      mode === 'markdown'
        ? '# Sample Atlas'
        : mode === 'diagnostics'
        ? '"workspaceCount"'
        : '"worlds"'
    );
  });

  it('omits world content from diagnostics export', () => {
    const text = getDataExportText(createSeedWorldDocument(), 'diagnostics', {
      diagnosticsRuntime: {
        loadCheckedAt: '2026-06-01T00:00:00.000Z',
        loadState: 'saved',
        recoverySnapshotAvailable: true,
        recoverySnapshotCreatedAt: '2026-06-01T00:00:00.000Z',
        recoverySnapshotReason: 'import',
        saveState: 'Saved to this device.',
      },
    });

    expect(text).toContain('"includesWorldContent": false');
    expect(text).toContain('"loadState": "saved"');
    expect(text).toContain('"saveState": "Saved to this device."');
    expect(text).toContain('"recoverySnapshotAvailable": true');
    expect(text).toContain('"recoverySnapshotReason": "import"');
    expect(text).not.toContain('Sample Atlas');
    expect(text).not.toContain('Mira Rowan');
  });

  it('exports readable relationship names in Markdown', () => {
    const text = getDataExportText(createSeedWorldDocument(), 'markdown');

    expect(text).toContain('Mira Rowan member of The Cartographers Guild');
  });

  it('builds share payloads from visible export text', () => {
    expect(getDataExportSharePayload('active-json', '{"worlds":[]}')).toEqual({
      title: `${valgaronProduct.name} active workspace JSON backup`,
      message: '{"worlds":[]}',
    });
  });

  it('centralizes export workflow labels and messages', () => {
    expect(dataExportCopy).toMatchObject({
      title: 'Export',
      shareLabel: 'Share Export',
      refreshLabel: 'Refresh Export',
      shareOpenedMessage: 'Opened the device share sheet.',
      replaceEditedTitle: 'Replace edited export text?',
      refreshEditedTitle: 'Refresh export text?',
    });
    expect(dataExportCopy.replaceEditedMessage).toContain(
      'selected export format'
    );
    expect(dataExportCopy.shareUnavailableMessage).toContain(
      'export text is still ready'
    );
  });

  it('flags edited or empty visible export text before sharing', () => {
    expect(getDataExportDraftState('generated', 'generated')).toEqual({
      canShare: true,
      isEdited: false,
      statusMessage: '',
    });
    expect(getDataExportDraftState('generated', 'changed')).toMatchObject({
      canShare: true,
      isEdited: true,
    });
    expect(getDataExportDraftState('generated', '   ')).toMatchObject({
      canShare: false,
      isEdited: true,
    });
  });

  it('keeps local export edits when generated export text changes', () => {
    expect(
      getNextVisibleExportText({
        currentGeneratedText: 'old generated',
        nextGeneratedText: 'new generated',
        visibleText: 'old generated',
      })
    ).toBe('new generated');
    expect(
      getNextVisibleExportText({
        currentGeneratedText: 'old generated',
        nextGeneratedText: 'new generated',
        visibleText: 'local edit',
      })
    ).toBe('local edit');
  });

  it('formats import previews with shared review details', () => {
    const previewText = getDataImportPreviewText({
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

  it('derives import review state from parsed import text', () => {
    expect(getDataImportReviewState('', null)).toEqual({
      canImport: false,
      error: '',
      previewText: null,
    });

    expect(
      getDataImportReviewState('not json', {
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
      getDataImportReviewState(JSON.stringify(document), {
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

  it('centralizes import section labels and actions', () => {
    expect(dataImportCopy).toMatchObject({
      title: 'Import JSON backup',
      kicker: 'Validated import',
      fileLabel: 'Choose JSON file',
      textAreaLabel: 'Backup JSON',
      previewLabel: 'Preview Import',
      importLabel: 'Import Backup',
      clearLabel: 'Clear',
    });
  });

  it('builds recovery snapshot rows and shared action copy', () => {
    const model = getDataRecoverySnapshotModel([
      {
        id: 'snapshot-1',
        reason: 'import',
        createdAt: '2026-06-01T09:00:00.000Z',
        activeWorldName: 'Sample Atlas',
        worldCount: 1,
        entryCount: 10,
        relationshipCount: 5,
      },
      {
        id: 'snapshot-2',
        reason: 'relationship-delete',
        createdAt: '2026-06-02T09:00:00.000Z',
        activeWorldName: 'Sample Atlas',
        worldCount: 2,
        entryCount: 12,
        relationshipCount: 7,
      },
    ]);

    expect(model).toMatchObject({
      title: 'Recovery snapshots',
      countLabel: '2 saved recovery points',
      emptyTitle: 'No recovery snapshots yet.',
      emptyDetail:
        'A snapshot is created automatically before import, reset, restore, and delete actions.',
    });
    expect(model.rows[0]).toMatchObject({
      id: 'snapshot-2',
      reasonTitle: 'Before relationship delete',
      reasonPhrase: 'before relationship delete',
      activeWorldName: 'Sample Atlas',
      countSummary: '2 worlds, 12 entries, 7 relationships',
      restoreLabel: 'Restore Snapshot',
      deleteLabel: 'Delete Snapshot',
      latestPrefix: 'Latest: ',
    });
    expect(model.rows[0].mobileSummaryText).toContain(
      'Recovery snapshot before relationship delete: Sample Atlas'
    );
    expect(model.rows[1]).toMatchObject({
      id: 'snapshot-1',
      countSummary: '1 world, 10 entries, 5 relationships',
      latestPrefix: 'Older: ',
    });
  });

  it('centralizes reset section copy and action label', () => {
    expect(dataResetCopy).toMatchObject({
      title: 'Reset starter data',
      kicker: 'Destructive action',
      actionLabel: 'Reset Starter Data',
    });
    expect(dataResetCopy.description).toContain('Export JSON first');
  });

  it('summarizes Data storage state without world content', () => {
    const status = getDataStorageStatusModel({
      lastRecoverySnapshot: {
        createdAt: '2026-06-01T09:00:00.000Z',
        reason: 'import',
      },
      loadStatus: {
        checkedAt: '2026-06-01T09:00:00.000Z',
        source: 'saved',
      },
      saveMessage: 'Saved to this device.',
      recoverySnapshotCount: 3,
    });

    expect(status.loadLine).toContain('Load state: saved');
    expect(status.saveLine).toBe('Device save: Saved to this device.');
    expect(status.recoveryLine).toContain('3 snapshots saved');
    expect(status.recoveryLine).toContain('before import');
    expect(JSON.stringify(status)).not.toContain('Sample Atlas');
    expect(JSON.stringify(status)).not.toContain('Mira Rowan');
  });

  it('summarizes the latest Data storage recovery snapshot by timestamp', () => {
    const status = getDataStorageStatusModel({
      loadStatus: {
        checkedAt: '2026-06-01T09:00:00.000Z',
        source: 'current',
      },
      recoverySnapshots: [
        {
          createdAt: '2026-06-01T09:00:00.000Z',
          reason: 'import',
        },
        {
          createdAt: '2026-06-03T09:00:00.000Z',
          reason: 'restore',
        },
      ],
      saveLineLabel: 'Manual save',
      saveMessage: 'Last save attempt: Jun 1, 2026.',
    });

    expect(status.saveLine).toBe(
      'Manual save: Last save attempt: Jun 1, 2026.'
    );
    expect(status.recoveryLine).toContain('2 snapshots saved');
    expect(status.recoveryLine).toContain('before snapshot restore');
    expect(status.recoveryLine).toContain('Jun 3, 2026');
  });
});
