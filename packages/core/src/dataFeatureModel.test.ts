import { describe, expect, it } from '@jest/globals';
import { createSeedWorldDocument } from './seedCodex';
import { valgaronProduct } from './shell';
import {
  dataExportCopy,
  dataDownloadCopy,
  dataExportOptions,
  dataExportSectionIds,
  dataShellExportActions,
  dataHelpCopy,
  dataImportCopy,
  dataActionResultMessages,
  dataRecoverySnapshotDeleteFailedMessage,
  dataRecoverySnapshotSaveFailedMessage,
  dataRecoverySnapshotUnavailableMessage,
  dataRouteFocusTargetIds,
  dataResetCopy,
  dataShellMenuCopy,
  dataStorageCopy,
  formatDataShellDownloadResultMessage,
  getDataActionResultMessage,
  getDataDiagnosticsSummaryText,
  getDataExportDraftState,
  getDataExportSharePayload,
  getDataExportText,
  formatDataDownloadSuccessMessage,
  formatDataImportFileLoadedMessage,
  formatDataImportFileReadFailedMessage,
  getDataImportPreviewText,
  getDataImportReviewState,
  getDataRecoverySnapshotModel,
  getDataRouteFocusTargetId,
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

  it('defines shared shell export shortcuts for compact Data menus', () => {
    expect(dataShellExportActions).toEqual([
      {
        downloadLabel: 'Download Active JSON',
        heading: 'Active workspace JSON',
        mode: 'active-json',
      },
      {
        downloadLabel: 'Download All JSON',
        heading: 'Full document JSON',
        mode: 'full-json',
      },
      {
        downloadLabel: 'Download Markdown',
        heading: 'Markdown export',
        mode: 'markdown',
      },
    ]);
    expect(dataShellMenuCopy).toMatchObject({
      triggerLabel: 'Data Menu',
      menuAccessibilityLabel: 'Data actions',
      importJsonBackupLabel: 'Import JSON Backup',
    });
    expect(
      formatDataShellDownloadResultMessage({
        didDownload: true,
        successLabel: 'Markdown export',
      })
    ).toBe('Markdown export downloaded.');
    expect(
      formatDataShellDownloadResultMessage({
        didDownload: false,
        successLabel: 'Markdown export',
      })
    ).toBe(dataShellMenuCopy.downloadUnavailableMessage);
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
    expect(dataDownloadCopy.exportUnavailableMessage).toContain(
      'copy the export text'
    );
    expect(dataDownloadCopy.diagnosticsUnavailableMessage).toContain(
      'copy the diagnostics text'
    );
    expect(formatDataDownloadSuccessMessage('sample.json')).toBe(
      'Downloaded sample.json.'
    );
  });

  it('resolves shared Data route focus aliases', () => {
    expect(
      getDataRouteFocusTargetId({
        focusId: dataRouteFocusTargetIds.export,
        mode: 'full-json',
      })
    ).toBe(dataExportSectionIds['full-json']);
    expect(
      getDataRouteFocusTargetId({
        focusId: dataRouteFocusTargetIds.export,
        mode: 'unknown',
      })
    ).toBe(dataExportSectionIds['active-json']);
    expect(
      getDataRouteFocusTargetId({
        focusId: dataRouteFocusTargetIds.importJsonBackup,
      })
    ).toBe(dataRouteFocusTargetIds.importJsonBackup);
    expect(getDataRouteFocusTargetId({ focusId: '' })).toBe('');
  });

  it('centralizes recovery-aware Data action result messages', () => {
    expect(Object.keys(dataActionResultMessages).sort()).toEqual([
      'delete-snapshot',
      'import-document',
      'reset-document',
      'restore-snapshot',
    ]);
    expect(getDataActionResultMessage('delete-snapshot')).toContain(
      'recovery snapshot'
    );
    expect(getDataActionResultMessage('import-document')).toContain(
      'on this device'
    );
    expect(getDataActionResultMessage('reset-document')).toContain(
      'recovery snapshot'
    );
    expect(getDataActionResultMessage('restore-snapshot')).toContain(
      'previous document'
    );
    expect(dataRecoverySnapshotSaveFailedMessage).toContain('Export JSON');
    expect(dataRecoverySnapshotUnavailableMessage).toContain('No recovery');
    expect(dataRecoverySnapshotDeleteFailedMessage).toContain(
      'Could not delete'
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
      webImageCount: 0,
      uploadedImageCount: 0,
      uploadedImageByteTotal: 0,
      savedAt: '2026-06-01T09:00:00.000Z',
    });

    expect(previewText.title).toBe('Sample Atlas');
    expect(previewText.detail).toContain(
      '1 workspace, 10 entries, 5 relationships, 0 uploaded images, 0 web images.'
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
          webImageCount: 0,
          uploadedImageCount: 0,
          uploadedImageByteTotal: 0,
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
      title: 'Import JSON or ZIP backup',
      kicker: 'Validated import',
      fileLabel: 'Choose JSON or ZIP file',
      textAreaLabel: 'Backup JSON',
      previewLabel: 'Preview Import',
      previewStatusLabel: 'Preview',
      importLabel: 'Import Backup',
      clearLabel: 'Clear',
      unappliedLabel: 'Unapplied',
      lastImportLabel: 'Last import',
      clearEditedTitle: 'Clear import text?',
      clearEditedMessage:
        'The pasted import text will be cleared from this screen.',
      clearAfterReplacementMessage:
        'The pasted import text will be cleared after this document replacement.',
      fileUnavailableMessage:
        'File import is unavailable in this runtime; paste the JSON backup instead.',
    });
    expect(formatDataImportFileLoadedMessage('atlas.json')).toBe(
      'Loaded atlas.json. Review the preview before importing.'
    );
    expect(formatDataImportFileReadFailedMessage('atlas.json')).toBe(
      'Could not read atlas.json. Paste the JSON backup instead.'
    );
    expect(dataStorageCopy).toMatchObject({
      kicker: 'Storage status',
      title: 'Manual local save',
      manualSaveGuidance:
        'Edits stay in this session until you use the header Save button. Export ZIP backups when uploaded images must be recoverable; JSON preserves image links and metadata only.',
      mobileCurrentWorkspaceLabel: 'Current workspace',
      mobileSavedTimestampLabel: 'Saved timestamp',
      diagnosticsLabel: 'Diagnostics',
      noRecoveryIssueMessage: 'No local storage recovery issue was found.',
      recoveryGuidance:
        'Recovery snapshots are saved before destructive actions. Keep ZIP exports as the device-independent backup when the document has uploaded images.',
      storageLoadIssuesLabel: 'Storage load issues',
    });
    expect(dataHelpCopy).toMatchObject({
      kicker: 'Backup guidance',
      title: 'Help',
      backupHelpLabel: 'Backup Help',
      openHelpLabel: 'Open Help',
      leaveWithDraftTitle: 'Open Help?',
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
      confirmationSubject: 'Before relationship delete for Sample Atlas',
      countSummary: '2 worlds, 12 entries, 7 relationships',
      restoreLabel: 'Restore Snapshot',
      restoreAccessibilityLabel:
        'Restore Before relationship delete for Sample Atlas',
      restoreAccessibilityHint:
        'Restores this saved recovery snapshot after confirmation.',
      deleteLabel: 'Delete Snapshot',
      deleteAccessibilityLabel:
        'Delete Before relationship delete for Sample Atlas',
      deleteAccessibilityHint:
        'Deletes this recovery snapshot after confirmation.',
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

  it('formats compact Data diagnostics summaries', () => {
    expect(
      getDataDiagnosticsSummaryText({
        archivedEntryCount: 1,
        relationshipCount: 5,
        totalEntryCount: 10,
        workspaceCount: 1,
      })
    ).toBe('1 workspace, 10 entries, 5 relationships, 1 archived entry.');
    expect(
      getDataDiagnosticsSummaryText({
        archivedEntryCount: 2,
        relationshipCount: 1,
        totalEntryCount: 1,
        workspaceCount: 2,
      })
    ).toBe('2 workspaces, 1 entry, 1 relationship, 2 archived entries.');
  });

  it('centralizes reset section copy and action label', () => {
    expect(dataResetCopy).toMatchObject({
      title: 'Reset starter data',
      kicker: 'Destructive action',
      actionLabel: 'Reset Starter Data',
    });
    expect(dataResetCopy.description).toContain('Export JSON first');
    expect(dataStorageCopy.manualSaveLineLabel).toBe('Manual save');
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

    expect(status.currentWorkspaceLine).toBe('');
    expect(status.loadLine).toContain('Load state: saved');
    expect(status.saveLine).toBe('Device save: Saved to this device.');
    expect(status.recoveryLine).toContain('3 snapshots saved');
    expect(status.recoveryLine).toContain('before import');
    expect(JSON.stringify(status)).not.toContain('Sample Atlas');
    expect(JSON.stringify(status)).not.toContain('Mira Rowan');
  });

  it('summarizes Data current workspace and saved timestamp when provided', () => {
    expect(
      getDataStorageStatusModel({
        currentWorkspaceName: 'Sample Atlas',
        loadStatus: {
          checkedAt: '2026-06-01T09:00:00.000Z',
          source: 'saved',
        },
        savedAt: '2026-06-02T09:00:00.000Z',
        saveMessage: 'Saved to this device.',
      }).currentWorkspaceLine
    ).toBe(
      'Current workspace: Sample Atlas. Saved timestamp: Jun 2, 2026, 2:00 AM.'
    );
  });

  it('omits Data current workspace text when workspace metadata is unavailable', () => {
    expect(
      getDataStorageStatusModel({
        loadStatus: {
          checkedAt: '2026-06-01T09:00:00.000Z',
          source: 'saved',
        },
        saveMessage: 'Saved to this device.',
      }).currentWorkspaceLine
    ).toBe('');
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
