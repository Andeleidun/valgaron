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
    expect(typeof core.saveEntryInActiveWorkspace).toBe('function');
    expect(typeof core.archiveEntryInActiveWorkspace).toBe('function');
    expect(typeof core.deleteEntryFromActiveWorkspace).toBe('function');
    expect(typeof core.saveRelationshipInActiveWorkspace).toBe('function');
    expect(typeof core.deleteRelationshipFromActiveWorkspace).toBe('function');
    expect(typeof core.moveTimelineEventInActiveWorkspace).toBe('function');
    expect(typeof core.savePlanetaryWorldInActiveWorkspace).toBe('function');
    expect(typeof core.archivePlanetaryWorldInActiveWorkspace).toBe('function');
    expect(typeof core.deletePlanetaryWorldFromActiveWorkspace).toBe(
      'function'
    );
    expect(typeof core.createEntryTypeInActiveWorkspace).toBe('function');
    expect(typeof core.deleteEntryTypeFromActiveWorkspace).toBe('function');
    expect(typeof core.summarizeRecoverySnapshot).toBe('function');
    expect(typeof core.getTimelineDiagnostics).toBe('function');
    expect(typeof core.getTimelineEventItem).toBe('function');
    expect(typeof core.getTimelineHighlights).toBe('function');
    expect(typeof core.getCodexExportFilename).toBe('function');
    expect(typeof core.getDataExportText).toBe('function');
    expect(typeof core.getDataImportReviewState).toBe('function');
    expect(typeof core.getDataRouteFocusTargetId).toBe('function');
    expect(typeof core.getLimitedResultModel).toBe('function');
    expect(typeof core.getFeatureDisplayScaleDecision).toBe('function');
    expect(typeof core.mobileFeatureDisplayLimits.entryResults).toBe('number');
    expect(typeof core.getEntryListModel).toBe('function');
    expect(typeof core.getEntryListEmptyStateModel).toBe('function');
    expect(typeof core.getEntryDetailDisplayModel).toBe('function');
    expect(typeof core.getEntryEditorBaseFields).toBe('function');
    expect(typeof core.getEntryEditorDetailFieldModels).toBe('function');
    expect(typeof core.getEntryEditorNotesPreviewModel).toBe('function');
    expect(typeof core.getEntryEditorSelectedActionModel).toBe('function');
    expect(typeof core.getEntryHiddenDetailCleanupModel).toBe('function');
    expect(typeof core.getEntrySectionNavigationOptions).toBe('function');
    expect(typeof core.getEntryTagFilterOptions).toBe('function');
    expect(typeof core.getEntrySortControlOptions).toBe('function');
    expect(typeof core.getRelationshipHealthSummary).toBe('function');
    expect(typeof core.getVisibleWorkspaceEntries).toBe('function');
    expect(typeof core.getWorkspaceOverviewModel).toBe('function');
    expect(typeof core.getWorkspaceActionState).toBe('function');
    expect(typeof core.getWorkspaceFeatureModel).toBe('function');
    expect(typeof core.workspaceDraftFrom).toBe('function');
    expect(typeof core.emptyEntryTypeDraft).toBe('function');
    expect(typeof core.planetaryWorldDraftFrom).toBe('function');
    expect(typeof core.formatWorkspaceFeatureAccessibilityLabel).toBe(
      'function'
    );
    expect(typeof core.getDestructiveActionCopy).toBe('function');
    expect(typeof core.getCodexEntriesRoute).toBe('function');
    expect(typeof core.getCodexRelationshipsRoute).toBe('function');
    expect(typeof core.parseCodexRouteIntent).toBe('function');
    expect(typeof core.formatCodexRouteIntent).toBe('function');
    expect(typeof core.getRuntimeRecoveryCopy).toBe('function');
    expect(typeof core.getRelationshipGraphViewModel).toBe('function');
    expect(typeof core.getRelationshipEntrySelectOptions).toBe('function');
    expect(typeof core.getRelationshipTypeSuggestions).toBe('function');
    expect(typeof core.getRelationshipListModel).toBe('function');
    expect(typeof core.getRelationshipEntryRoute).toBe('function');
    expect(typeof core.getRelationshipEntryRouteById).toBe('function');
    expect(typeof core.getRelationshipManagementRoute).toBe('function');
    expect(typeof core.getCodexHelpScreenModel).toBe('function');
    expect(typeof core.getWorkspaceOverviewSectionRoute).toBe('function');
    expect(typeof core.entryStatusFilterControl).toBe('object');
    expect(typeof core.entrySortControl).toBe('object');
    expect(typeof core.entryUpdatedFilterControl).toBe('object');
    expect(typeof core.entryShowArchivedControl).toBe('object');
    expect(typeof core.entryDraftStatusControl).toBe('object');
    expect(typeof core.entryPinnedControl).toBe('object');
    expect(typeof core.relationshipDraftStatusControl).toBe('object');
    expect(typeof core.relationshipTypeControl).toBe('object');
    expect(typeof core.relationshipNoteControl).toBe('object');
    expect(typeof core.relationshipSourceControl).toBe('object');
    expect(typeof core.relationshipTargetControl).toBe('object');
    expect(typeof core.relationshipDirectionalControl).toBe('object');
    expect(typeof core.relationshipListTypeFilterControl).toBe('object');
    expect(typeof core.relationshipGraphStatusFilterControl).toBe('object');
    expect(typeof core.relationshipGraphTypeFilterControl).toBe('object');
    expect(typeof core.getDeviceSaveStatusModel).toBe('function');
  });
});
