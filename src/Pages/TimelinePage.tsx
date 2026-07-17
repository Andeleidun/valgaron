import type {
  WorldCodex,
  WorldEntry,
  WorldImageAsset,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspaceSchema,
} from '@valgaron/core';
import { SectionPage } from './SectionPage';
import type { EntryRelationshipDocumentTransaction } from '../Utlilities/useWorldDocumentState';

export function TimelinePage({
  codex,
  relationships,
  sections,
  workspaceSchema,
  onArchiveEntry,
  onDeleteEntry,
  onDeleteRelationship,
  onCommitEntryRelationshipTransaction,
  onSaveEntry,
  onSaveRelationship,
}: {
  codex: WorldCodex;
  relationships: readonly WorldRelationship[];
  sections: readonly WorldSectionConfig[];
  workspaceSchema?: WorldWorkspaceSchema;
  onArchiveEntry: (entry: WorldEntry, archived: boolean) => void;
  onDeleteEntry: (entry: WorldEntry) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onCommitEntryRelationshipTransaction: (
    transaction: EntryRelationshipDocumentTransaction
  ) => void;
  onSaveEntry: (entry: WorldEntry, assets?: readonly WorldImageAsset[]) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
}) {
  return (
    <SectionPage
      codex={codex}
      fixedSectionId="timeline"
      onArchiveEntry={onArchiveEntry}
      onDeleteEntry={onDeleteEntry}
      onDeleteRelationship={onDeleteRelationship}
      onCommitEntryRelationshipTransaction={
        onCommitEntryRelationshipTransaction
      }
      onSaveEntry={onSaveEntry}
      onSaveRelationship={onSaveRelationship}
      relationships={relationships}
      sections={sections}
      workspaceSchema={workspaceSchema}
    />
  );
}
