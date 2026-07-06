import type {
  WorldCodex,
  WorldEntry,
  WorldRelationship,
  WorldSectionConfig,
  WorldWorkspaceSchema,
} from '@valgaron/core';
import { SectionPage } from './SectionPage';

export function TimelinePage({
  codex,
  relationships,
  sections,
  workspaceSchema,
  onArchiveEntry,
  onDeleteEntry,
  onDeleteRelationship,
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
  onSaveEntry: (entry: WorldEntry) => void;
  onSaveRelationship: (relationship: WorldRelationship) => void;
}) {
  return (
    <SectionPage
      codex={codex}
      fixedSectionId="timeline"
      onArchiveEntry={onArchiveEntry}
      onDeleteEntry={onDeleteEntry}
      onDeleteRelationship={onDeleteRelationship}
      onSaveEntry={onSaveEntry}
      onSaveRelationship={onSaveRelationship}
      relationships={relationships}
      sections={sections}
      workspaceSchema={workspaceSchema}
    />
  );
}
