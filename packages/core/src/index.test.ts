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
    expect(typeof core.getRelationshipHealthSummary).toBe('function');
    expect(typeof core.getVisibleWorkspaceEntries).toBe('function');
    expect(typeof core.getWorkspaceActionState).toBe('function');
    expect(typeof core.getDestructiveActionCopy).toBe('function');
    expect(typeof core.getCodexEntriesRoute).toBe('function');
    expect(typeof core.getCodexRelationshipsRoute).toBe('function');
  });
});
