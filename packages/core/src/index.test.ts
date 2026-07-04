import { describe, expect, it } from '@jest/globals';
import * as core from './index';

describe('core package exports', () => {
  it('exposes Valgaron codex contracts without source-app surfaces', () => {
    expect(core.CURRENT_WORLD_SCHEMA_VERSION).toBe(2);
    expect(core.worldSections.map((section) => section.id)).toEqual([
      'characters',
      'places',
      'factions',
      'lore',
      'timeline',
    ]);
    expect(typeof core.parseWorldDocument).toBe('function');
    expect(typeof core.createSeedWorldDocument).toBe('function');
    expect(typeof core.getWorldDocumentDiagnostics).toBe('function');
    expect(typeof core.summarizeRecoverySnapshot).toBe('function');
    expect(typeof core.getTimelineDiagnostics).toBe('function');
    expect(typeof core.getTimelineHighlights).toBe('function');
    expect(typeof core.getCodexExportFilename).toBe('function');
    expect(typeof core.getDataExportText).toBe('function');
    expect(typeof core.getDataImportReviewState).toBe('function');
    expect(typeof core.getRelationshipHealthSummary).toBe('function');
    expect(typeof core.getVisibleWorkspaceEntries).toBe('function');
    expect(typeof core.getWorkspaceActionState).toBe('function');
    expect(typeof core.getWorkspaceFeatureModel).toBe('function');
    expect(typeof core.getDestructiveActionCopy).toBe('function');
    expect(typeof core.getCodexEntriesRoute).toBe('function');
    expect(typeof core.getCodexRelationshipsRoute).toBe('function');
    expect(typeof core.parseCodexRouteIntent).toBe('function');
    expect(typeof core.formatCodexRouteIntent).toBe('function');
    expect(typeof core.entryStatusFilterControl).toBe('object');
    expect(typeof core.entryDraftStatusControl).toBe('object');
    expect(typeof core.relationshipDraftStatusControl).toBe('object');
    expect(typeof core.getDeviceSaveStatusModel).toBe('function');
  });
});
