import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  applyEntry,
  addVocabularyValue,
  createCustomEntryType,
  createEmptyRelationshipDraft,
  createSeedWorldDocument,
  entryFromDraft,
  getActiveWorld,
  removeCustomEntryTypeField,
  relationshipDirectionalControl,
  updateActiveWorkspace,
} from '@valgaron/core';
import type { WorldRelationship } from '@valgaron/core';
import type { MobileCodexController } from '../state/MobileCodexContext';
import { EntriesScreen } from './EntriesScreen';
import { MoreScreen } from './MoreScreen';
import { RelationshipsScreen } from './RelationshipsScreen';
import { ActionButton, CheckboxField, SelectField } from './screenPrimitives';

type MockNativeProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    checked?: boolean;
    disabled?: boolean;
    expanded?: boolean;
    selected?: boolean;
  };
  accessibilityValue?: {
    text?: string;
  };
  children?:
    | React.ReactNode
    | ((state: { pressed: boolean }) => React.ReactNode);
  disabled?: boolean;
  placeholder?: string;
  testID?: string;
  value?: string;
  visible?: boolean;
};

let mockMobileCodexController: MobileCodexController;
let mockRouteParams: {
  era?: string;
  entryId?: string;
  entryQuery?: string;
  involvedEntryId?: string;
  intent?: string;
  query?: string;
  relationshipQuery?: string;
  routeFocusId?: string;
  sectionId?: string;
  showArchived?: string;
  sort?: string;
  status?: string;
  tag?: string;
  updatedWithinDays?: string;
  view?: string;
};

jest.mock('../state/MobileCodexContext', () => ({
  useMobileCodex: () => mockMobileCodexController,
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({
    ...mockRouteParams,
  }),
}));

jest.mock('react-native', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const renderChildren = (children: MockNativeProps['children']) =>
    typeof children === 'function' ? children({ pressed: false }) : children;

  return {
    Alert: {
      alert: jest.fn(),
    },
    KeyboardAvoidingView: ({ children }: MockNativeProps) =>
      ReactRuntime.createElement('div', null, renderChildren(children)),
    Modal: ({ children, visible }: MockNativeProps) =>
      visible
        ? ReactRuntime.createElement('div', null, renderChildren(children))
        : null,
    Platform: {
      OS: 'android',
    },
    Pressable: ({
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
      accessibilityValue,
      children,
      disabled,
      testID,
    }: MockNativeProps) =>
      ReactRuntime.createElement(
        'div',
        {
          'aria-checked':
            accessibilityState?.checked === undefined
              ? undefined
              : String(accessibilityState.checked),
          'aria-disabled':
            accessibilityState?.disabled === undefined
              ? disabled
                ? 'true'
                : undefined
              : String(accessibilityState.disabled),
          'aria-expanded':
            accessibilityState?.expanded === undefined
              ? undefined
              : String(accessibilityState.expanded),
          'aria-label': accessibilityLabel,
          'aria-selected':
            accessibilityState?.selected === undefined
              ? undefined
              : String(accessibilityState.selected),
          'aria-valuetext': accessibilityValue?.text,
          'data-testid': testID,
          role: accessibilityRole,
        },
        renderChildren(children)
      ),
    ScrollView: ({ children }: MockNativeProps) =>
      ReactRuntime.createElement('div', null, renderChildren(children)),
    StyleSheet: {
      create: <TStyles extends Record<string, unknown>>(styles: TStyles) =>
        styles,
      flatten: (style: unknown) => style,
    },
    Text: ({ accessibilityRole, children, testID }: MockNativeProps) =>
      ReactRuntime.createElement(
        'span',
        { 'data-testid': testID, role: accessibilityRole },
        renderChildren(children)
      ),
    TextInput: ({
      accessibilityLabel,
      placeholder,
      testID,
      value,
    }: MockNativeProps) =>
      ReactRuntime.createElement('input', {
        'aria-label': accessibilityLabel,
        'data-testid': testID,
        defaultValue: value,
        placeholder,
      }),
    View: ({ children, testID }: MockNativeProps) =>
      ReactRuntime.createElement(
        'div',
        { 'data-testid': testID },
        renderChildren(children)
      ),
  };
});

function createMockController(): MobileCodexController {
  const document = createSeedWorldDocument();
  const homePlaceRelationship: WorldRelationship = {
    id: 'relationship-mira-northwatch-harbor-home',
    sourceEntryId: 'character-mira-rowan',
    targetEntryId: 'place-northwatch-harbor',
    type: 'resides in',
    directional: true,
    note: '',
    status: 'draft',
    createdAt: document.savedAt,
    updatedAt: document.savedAt,
  };
  document.worlds[0] = {
    ...document.worlds[0],
    relationships: [...document.worlds[0].relationships, homePlaceRelationship],
    schema: {
      ...document.worlds[0].schema,
      vocabularies: document.worlds[0].schema.vocabularies.map((vocabulary) =>
        vocabulary.id === 'character-ancestry'
          ? {
              ...vocabulary,
              values: vocabulary.values.map((value) =>
                value.id === 'monster'
                  ? { ...value, status: 'archived' as const }
                  : value
              ),
            }
          : vocabulary
      ),
    },
  };
  const activeWorld = getActiveWorld(document);

  return {
    activeWorld,
    addEntryTypeFields: () => true,
    archiveEntry: () => undefined,
    archivePlanetaryWorld: () => undefined,
    archiveWorkspace: () => undefined,
    clearHiddenEntryDetail: () => undefined,
    clearHiddenEntryDetails: () => undefined,
    createEntryType: () => true,
    createRelationshipDraft: () => createEmptyRelationshipDraft(),
    createWorkspace: () => true,
    deleteRecoverySnapshot: () => undefined,
    document,
    duplicateEntry: (_section, entry) => entry,
    duplicateWorkspace: () => undefined,
    formMessage: '',
    importDocumentText: () => undefined,
    importResult: null,
    isLoading: false,
    lastRecoverySnapshot: null,
    loadStatus: {
      checkedAt: document.savedAt,
      message: 'Opening starter data.',
      source: 'seed',
    },
    moveTimelineEvent: () => undefined,
    moveEntryTypeField: () => true,
    moveVocabularyValue: () => true,
    renameEntryTypeField: () => true,
    reassignTimelineEra: () => true,
    removeEntryTypeField: () => true,
    addVocabularyValue: () => true,
    updateVocabularyValue: () => true,
    archiveVocabularyValue: () => true,
    updateFieldOverride: () => true,
    permanentlyDeleteEntry: () => undefined,
    permanentlyDeleteEntryType: () => undefined,
    permanentlyDeletePlanetaryWorld: () => undefined,
    permanentlyDeleteWorkspace: () => undefined,
    recoverySnapshots: [],
    removeRelationship: () => undefined,
    resetToSeed: () => undefined,
    restoreRecoverySnapshot: () => undefined,
    saveEntryDraft: () => null,
    saveMessage: '',
    savePlanetaryWorld: () => true,
    saveRelationshipDraft: () => true,
    sections: activeWorld.entryTypes,
    switchWorkspace: () => undefined,
    unlinkRelationship: () => undefined,
    updateWorkspace: () => true,
  };
}

describe('EntriesScreen render smoke', () => {
  beforeEach(() => {
    mockMobileCodexController = createMockController();
    mockRouteParams = {
      entryId: 'character-mira-rowan',
      intent: 'edit',
      query: 'Mira Rowan',
      sectionId: 'characters',
    };
  });

  it('renders the direct character edit route with grouped logical-tree fields and linked controls', () => {
    const documentWithAliasProfession = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        schema: {
          ...workspace.schema,
          vocabularies: workspace.schema.vocabularies.map((vocabulary) =>
            vocabulary.id === 'character-profession'
              ? {
                  ...vocabulary,
                  values: vocabulary.values.map((value) =>
                    value.label === 'Surveyor'
                      ? { ...value, aliases: ['Pathfinder'] }
                      : value
                  ),
                }
              : vocabulary
          ),
        },
        codex: {
          ...workspace.codex,
          characters: workspace.codex.characters.map((entry) =>
            entry.id === 'character-mira-rowan'
              ? {
                  ...entry,
                  fields: {
                    ...entry.fields,
                    profession: 'Pathfinder',
                  },
                }
              : entry
          ),
        },
      })
    );
    const activeWorld = getActiveWorld(documentWithAliasProfession);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithAliasProfession,
      sections: activeWorld.entryTypes,
    };

    const markup = renderToStaticMarkup(React.createElement(EntriesScreen));

    expect(markup).toContain('Edit Mira Rowan');
    expect(markup).toContain('Record basics');
    expect(markup).toContain('Category and role');
    expect(markup).toContain('Identity and origin');
    expect(markup).toContain('Profession and power');
    expect(markup).toContain('Linked character fields');
    expect(markup).toContain('Home');
    expect(markup).toContain('Affiliations');
    expect(markup).toContain('value="Human"');
    expect(markup).toContain('value="Pathfinder"');
    expect(markup).toContain('Use Surveyor');
    expect(markup).toContain('aria-label="Use Surveyor for Profession"');
    expect(markup).toContain(
      'aria-checked="false" aria-label="Pin entry on overview" role="checkbox"'
    );
    expect(markup).toContain('The Cartographers Guild');
    expect(markup).toContain('data-testid="entries.mode.index"');
    expect(markup).toContain('data-testid="entries.mode.context"');
    expect(markup).toContain('data-testid="entries.mode.edit"');
    expect(markup).toContain('Editing Mira Rowan.');
    expect(markup).not.toContain('data-testid="entries.section.characters"');
    expect(markup).not.toContain(
      'data-testid="entries.entry.character-mira-rowan"'
    );
    expect(markup).toContain('data-testid="entries.editor.title"');
    expect(markup).toContain('data-testid="entries.editor.save"');
    expect(markup).toContain('data-testid="entries.field.characterCategory"');
    expect(markup).toContain('data-testid="entries.field.ancestry"');
    expect(markup).toContain('data-testid="entries.field.profession"');
    expect(markup).toContain('data-testid="entries.linkedFields.section"');
    expect(markup).toContain('data-testid="entries.linkedField.homePlace"');
    expect(markup).toContain(
      'data-testid="entries.linkedField.homePlace.target.place-northwatch-harbor"'
    );
    expect(markup).toContain(
      'data-testid="entries.linkedField.homePlace.selectedTarget.place-northwatch-harbor"'
    );
    expect(markup).toContain(
      'data-testid="entries.linkedField.affiliations.selectedTarget.faction-cartographers-guild"'
    );
    expect(markup).toContain(
      'data-testid="entries.linkedField.homePlace.clear"'
    );
    expect(markup).toContain('Saved text link notes');
    expect(markup).toContain('1 exact match found.');
    expect(markup).toContain('Migrate Exact Matches');
  });

  it('renders the archived-only empty state recovery action', () => {
    const archivedDocument = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        codex: {
          ...workspace.codex,
          characters: workspace.codex.characters.map((entry) => ({
            ...entry,
            status: 'archived' as const,
          })),
        },
      })
    );
    const activeWorld = getActiveWorld(archivedDocument);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: archivedDocument,
      sections: activeWorld.entryTypes,
    };
    mockRouteParams = {
      sectionId: 'characters',
      view: 'index',
    };

    const markup = renderToStaticMarkup(React.createElement(EntriesScreen));

    expect(markup).toContain('Only archived entries are in this section.');
    expect(markup).toContain('Show Archived');
  });

  it('renders expandable mobile section index results', () => {
    mockRouteParams = {
      sectionId: 'characters',
    };
    const documentWithManyCharacters = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        codex: {
          ...workspace.codex,
          characters: [
            ...workspace.codex.characters,
            ...Array.from({ length: 55 }, (_, index) => ({
              ...workspace.codex.characters[0],
              id: `character-index-extra-${index}`,
              name: `Index Extra Character ${index + 1}`,
            })),
          ],
        },
      })
    );
    const activeWorld = getActiveWorld(documentWithManyCharacters);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithManyCharacters,
      sections: activeWorld.entryTypes,
    };

    const markup = renderToStaticMarkup(React.createElement(EntriesScreen));

    expect(markup).toContain('more records.');
    expect(markup).toContain('More Records');
    expect(markup).not.toContain('Refine section search or filters');
  });

  it('hydrates mobile Workbench review queues from shared view routes', () => {
    mockRouteParams = {
      view: 'unlinked',
    };

    const markup = renderToStaticMarkup(React.createElement(EntriesScreen));

    expect(markup).toContain('Workbench Unlinked');
    expect(markup).toContain('1 record in this review queue.');
    expect(markup).toContain('The Ember Court');
    expect(markup).toContain('aria-label="Edit The Ember Court"');
    expect(markup).toContain('Review context for The Ember Court');
    expect(markup).toContain('aria-label="Review context for The Ember Court"');
  });

  it('renders the direct character context route with summary actions', () => {
    mockRouteParams = {
      entryId: 'character-mira-rowan',
      intent: 'context',
      query: 'Mira Rowan',
      sectionId: 'characters',
    };
    const documentWithPromptHeavyCharacter = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        codex: {
          ...workspace.codex,
          characters: workspace.codex.characters.map((entry) =>
            entry.id === 'character-mira-rowan'
              ? {
                  ...entry,
                  fields: {
                    ...entry.fields,
                    ancestry: '',
                    characterCategory: '',
                    currentStatus: '',
                    narrativeRole: '',
                    profession: '',
                  },
                  notes: '',
                  tags: [],
                }
              : entry
          ),
        },
      })
    );
    const activeWorld = getActiveWorld(documentWithPromptHeavyCharacter);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithPromptHeavyCharacter,
      sections: activeWorld.entryTypes,
    };

    const markup = renderToStaticMarkup(React.createElement(EntriesScreen));

    expect(markup).toContain('Mira Rowan');
    expect(markup).toContain('Relationships:');
    expect(markup).toContain('Completeness:');
    expect(markup).toContain('Review summary:');
    expect(markup).toContain('Drafting prompts: 7 prompts.');
    expect(markup).toContain('Legacy link text: 2 fields.');
    expect(markup).toContain(
      'Review links, cleanup, and selected-record review summaries.'
    );
    expect(markup).toContain('Reviewing context for Mira Rowan.');
    expect(markup).toContain('Edit Record');
    expect(markup).toContain('Back to Index');
    expect(markup).toContain('Manage Links');
    expect(markup).toContain('Drafting prompts:');
    expect(markup).toContain('Add Markdown notes.');
    expect(markup).toContain('Add at least one tag.');
    expect(markup).toContain('3 more drafting prompts.');
    expect(markup).toContain('Show 3 More Drafting Prompts');
    expect(markup).toContain('The Cartographers Guild');
    expect(markup).toContain('Review Context');
    expect(markup).toContain(
      'aria-label="Review context for The Cartographers Guild"'
    );
    expect(markup).toContain('aria-label="Edit Mira Rowan"');
    expect(markup).not.toContain('<span role="header">Edit Mira Rowan</span>');
  });

  it('renders expandable mobile section relationship text review items', () => {
    mockRouteParams = {
      entryId: 'character-mira-rowan',
      intent: 'context',
      query: 'Mira Rowan',
      sectionId: 'characters',
    };
    const documentWithLegacyLinkText = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        codex: {
          ...workspace.codex,
          characters: [
            ...workspace.codex.characters,
            ...Array.from({ length: 7 }, (_, index) => ({
              ...workspace.codex.characters[0],
              id: `character-legacy-link-${index}`,
              name: `Legacy Link Character ${index + 1}`,
              fields: {
                ...workspace.codex.characters[0].fields,
                affiliations: `Unresolved Guild ${index + 1}`,
              },
            })),
          ],
          factions: [
            ...workspace.codex.factions,
            {
              ...workspace.codex.factions[0],
              id: 'faction-unresolved-guild-hall',
              name: 'Unresolved Guild 1 Hall',
            },
          ],
        },
      })
    );
    const activeWorld = getActiveWorld(documentWithLegacyLinkText);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithLegacyLinkText,
      sections: activeWorld.entryTypes,
    };

    const markup = renderToStaticMarkup(React.createElement(EntriesScreen));

    expect(markup).toContain('Legacy Link Text');
    expect(markup).toContain('more legacy text item');
    expect(markup).toContain('Show ');
    expect(markup).toContain('More Legacy Text Items');
    expect(markup).toContain('Link Unresolved Guild 1 Hall');
    expect(markup).toContain(
      'aria-label="Link Unresolved Guild 1 to Unresolved Guild 1 Hall"'
    );
    expect(markup).not.toContain('Review affected entries to continue cleanup');
  });

  it('renders mobile timeline grouped event edit and context actions', () => {
    mockRouteParams = {};
    const TimelineEntriesScreen = EntriesScreen as React.ComponentType<{
      fixedSectionId?: string;
    }>;
    const markup = renderToStaticMarkup(
      React.createElement(TimelineEntriesScreen, { fixedSectionId: 'timeline' })
    );

    expect(markup).toContain('Timeline view');
    expect(markup).toContain('2 visible events in Timeline.');
    expect(markup).toContain('Era to change');
    expect(markup).toContain('New or existing era');
    expect(markup).toContain('Apply Era Change');
    expect(markup).toContain('Harbor Accord Signed');
    expect(markup).toContain(
      'data-testid="timeline.event.timeline-harbor-accord.edit"'
    );
    expect(markup).toContain(
      'data-testid="timeline.event.timeline-harbor-accord.context"'
    );
    expect(markup).toContain('Open Event');
    expect(markup).toContain('aria-label="Open Harbor Accord Signed"');
    expect(markup).toContain(
      'aria-label="Review context for Harbor Accord Signed"'
    );
    expect(markup).toContain('Review Context');
  });

  it('hydrates mobile timeline browse filters from route params', () => {
    mockRouteParams = {
      era: 'Charter Era',
      involvedEntryId: 'faction-cartographers-guild',
      query: 'Guild',
      showArchived: 'true',
      sort: 'name',
      status: 'draft',
      updatedWithinDays: '365',
    };
    const TimelineEntriesScreen = EntriesScreen as React.ComponentType<{
      fixedSectionId?: string;
    }>;

    const markup = renderToStaticMarkup(
      React.createElement(TimelineEntriesScreen, { fixedSectionId: 'timeline' })
    );

    expect(markup).toContain('1 visible event in Timeline.');
    expect(markup).toContain('Harbor Accord Signed');
  });

  it('renders timeline edit fields in chronology-focused groups', () => {
    mockRouteParams = {
      entryId: 'timeline-harbor-accord',
      intent: 'edit',
      query: 'Harbor Accord Signed',
      sectionId: 'timeline',
    };
    const TimelineEntriesScreen = EntriesScreen as React.ComponentType<{
      fixedSectionId?: string;
    }>;

    const markup = renderToStaticMarkup(
      React.createElement(TimelineEntriesScreen, { fixedSectionId: 'timeline' })
    );

    expect(markup).toContain('Edit Harbor Accord Signed');
    expect(markup).toContain('Chronology');
    expect(markup).toContain('Sort order');
    expect(markup).toContain('Date or order');
    expect(markup).toContain('Outcomes');
    expect(markup).toContain('Consequences');
    expect(markup).toContain('Linked timeline event fields');
  });

  it('renders custom timeline detail fields in the mobile timeline editor', () => {
    mockRouteParams = {
      entryId: 'timeline-harbor-accord',
      intent: 'edit',
      query: 'Harbor Accord Signed',
      sectionId: 'timeline',
    };
    const documentWithTimelineDetails = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        entryTypes: workspace.entryTypes.map((section) =>
          section.id === 'timeline'
            ? {
                ...section,
                detailFields: [
                  ...section.detailFields,
                  {
                    key: 'prophecy',
                    label: 'Prophecy',
                    suggestFromExistingValues: true,
                  },
                ],
              }
            : section
        ),
        codex: {
          ...workspace.codex,
          timeline: workspace.codex.timeline.map((entry) =>
            entry.id === 'timeline-harbor-accord'
              ? {
                  ...entry,
                  fields: { ...entry.fields, prophecy: 'First omen' },
                }
              : entry.id === 'timeline-first-survey'
              ? {
                  ...entry,
                  fields: { ...entry.fields, prophecy: 'Second omen' },
                }
              : entry
          ),
        },
      })
    );
    const activeWorld = getActiveWorld(documentWithTimelineDetails);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithTimelineDetails,
      sections: activeWorld.entryTypes,
    };
    const TimelineEntriesScreen = EntriesScreen as React.ComponentType<{
      fixedSectionId?: string;
    }>;

    const markup = renderToStaticMarkup(
      React.createElement(TimelineEntriesScreen, { fixedSectionId: 'timeline' })
    );

    expect(markup).toContain('Additional details');
    expect(markup).toContain('data-testid="entries.timeline.field.prophecy"');
    expect(markup).toContain('Second omen');
    expect(markup).toContain('aria-label="Use Second omen for Prophecy"');
  });

  it('seeds new timeline event drafts from the active era route', () => {
    mockRouteParams = {
      era: 'Charter Era',
      involvedEntryId: 'faction-cartographers-guild',
      intent: 'new',
      sectionId: 'timeline',
    };
    const TimelineEntriesScreen = EntriesScreen as React.ComponentType<{
      fixedSectionId?: string;
    }>;

    const markup = renderToStaticMarkup(
      React.createElement(TimelineEntriesScreen, { fixedSectionId: 'timeline' })
    );

    expect(markup).toContain('Create Timeline Event');
    expect(markup).toContain('Chronology');
    expect(markup).toContain('value="Charter Era"');
    expect(markup).toContain('Create Timeline Event And 1 Link');
    expect(markup).toContain('Involved records');
    expect(markup).toContain('Selected: The Cartographers Guild');
  });

  it('renders expandable mobile timeline involved-record filters', () => {
    mockRouteParams = {};
    const documentWithManyInvolvedRecords = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => {
        const extraLore = Array.from({ length: 25 }, (_, index) => ({
          ...workspace.codex.lore[0],
          id: `lore-timeline-involved-${index}`,
          name: `Timeline Source ${index + 1}`,
        }));
        return {
          ...workspace,
          codex: {
            ...workspace.codex,
            lore: [...workspace.codex.lore, ...extraLore],
          },
          relationships: [
            ...workspace.relationships,
            ...extraLore.map((entry, index) => ({
              id: `relationship-timeline-involved-${index}`,
              sourceEntryId: 'timeline-harbor-accord',
              targetEntryId: entry.id,
              type: 'involves',
              directional: false,
              note: '',
              status: 'draft' as const,
              createdAt: workspace.updatedAt,
              updatedAt: workspace.updatedAt,
            })),
          ],
        };
      }
    );
    const activeWorld = getActiveWorld(documentWithManyInvolvedRecords);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithManyInvolvedRecords,
      sections: activeWorld.entryTypes,
    };
    const TimelineEntriesScreen = EntriesScreen as React.ComponentType<{
      fixedSectionId?: string;
    }>;

    const markup = renderToStaticMarkup(
      React.createElement(TimelineEntriesScreen, { fixedSectionId: 'timeline' })
    );

    expect(markup).toContain('more involved record');
    expect(markup).toContain('More Involved Records');
    expect(markup).not.toContain('Refine involved search');
  });

  it('renders Relationship Studio review with relationship cleanup actions', () => {
    mockRouteParams = {};
    const duplicateRelationships: WorldRelationship[] = Array.from(
      { length: 7 },
      (_, index) => {
        const type =
          index === 0 ? 'member of' : `duplicate review group ${index}`;
        return {
          ...mockMobileCodexController.activeWorld.relationships[0],
          id: `relationship-duplicate-member-${index}`,
          type,
          createdAt: '2026-07-02T00:00:00.000Z',
          updatedAt: '2026-07-02T00:00:00.000Z',
        };
      }
    );
    const retainedDuplicateGroupRelationships: WorldRelationship[] =
      duplicateRelationships.slice(1).map((relationship, index) => ({
        ...relationship,
        id: `relationship-retained-duplicate-review-${index + 1}`,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      }));
    const documentWithDuplicateRelationship = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) => ({
        ...workspace,
        relationships: [
          ...workspace.relationships,
          ...duplicateRelationships,
          ...retainedDuplicateGroupRelationships,
        ],
      })
    );
    const activeWorld = getActiveWorld(documentWithDuplicateRelationship);
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld,
      document: documentWithDuplicateRelationship,
      sections: activeWorld.entryTypes,
    };

    const markup = renderToStaticMarkup(
      React.createElement(RelationshipsScreen)
    );

    expect(markup).toContain('Relationship Studio');
    expect(markup).toContain('Relationship Health');
    expect(markup).toContain('Legacy Link Text');
    expect(markup).toContain('Mira Rowan');
    expect(markup).toContain('Affiliations');
    expect(markup).toContain('Review Entry');
    expect(markup).toContain('Duplicate Relationships');
    expect(markup).toContain(
      'Saved relationships with the same source, target, type, status, direction, and note.'
    );
    expect(markup).toContain('Duplicate Relationships: 7 groups.');
    expect(markup).toContain('removes 1 duplicate');
    expect(markup).toContain('Show 1 More Duplicate Group');
  });

  it('renders checked mobile checkbox accessibility state from the shared primitive', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CheckboxField, {
        accessibilityLabel: relationshipDirectionalControl.accessibilityLabel,
        checked: true,
        label: relationshipDirectionalControl.label,
        onChange: () => undefined,
      })
    );

    expect(markup).toContain(
      'aria-checked="true" aria-label="Directional relationship" role="checkbox"'
    );
  });

  it('renders collapsed mobile select accessibility state from the shared primitive', () => {
    const markup = renderToStaticMarkup(
      React.createElement(SelectField, {
        label: 'Relationship type',
        onValueChange: () => undefined,
        options: [
          { label: 'Resides in', value: 'resides in' },
          { label: 'Member of', value: 'member of' },
        ],
        value: 'resides in',
      })
    );

    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-label="Relationship type"');
    expect(markup).toContain('role="button"');
    expect(markup).toContain('aria-valuetext="Resides in"');
  });

  it('renders expandable mobile action accessibility state from the shared primitive', () => {
    const collapsedMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        expanded: false,
        label: 'Show More Records',
        onPress: () => undefined,
      })
    );
    const expandedMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        expanded: true,
        label: 'Show Fewer Records',
        onPress: () => undefined,
      })
    );

    expect(collapsedMarkup).toContain('aria-expanded="false"');
    expect(collapsedMarkup).toContain('aria-label="Show More Records"');
    expect(collapsedMarkup).toContain('role="button"');
    expect(expandedMarkup).toContain('aria-expanded="true"');
    expect(expandedMarkup).toContain('aria-label="Show Fewer Records"');
    expect(expandedMarkup).toContain('role="button"');
  });

  it('omits mobile action selected state unless the caller opts in', () => {
    const ordinaryMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        label: 'Review Entry',
        onPress: () => undefined,
      })
    );
    const unselectedMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        label: 'All Tags',
        onPress: () => undefined,
        selected: false,
      })
    );
    const selectedMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        label: 'Draft',
        onPress: () => undefined,
        selected: true,
      })
    );

    expect(ordinaryMarkup).not.toContain('aria-selected');
    expect(unselectedMarkup).toContain('aria-selected="false"');
    expect(selectedMarkup).toContain('aria-selected="true"');
  });

  it('omits mobile action disabled state unless the action is disabled', () => {
    const ordinaryMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        label: 'Review Entry',
        onPress: () => undefined,
      })
    );
    const disabledMarkup = renderToStaticMarkup(
      React.createElement(ActionButton, {
        disabled: true,
        label: 'Save Entry',
        onPress: () => undefined,
      })
    );

    expect(ordinaryMarkup).not.toContain('aria-disabled');
    expect(disabledMarkup).toContain('aria-disabled="true"');
  });

  it('renders mobile relationship route focus directly in Links mode', () => {
    mockRouteParams = {
      entryId: 'character-mira-rowan',
      entryQuery: 'Mira Rowan',
      relationshipQuery: 'Mira Rowan',
    };

    const markup = renderToStaticMarkup(
      React.createElement(RelationshipsScreen)
    );

    expect(markup).toContain('Relationship Form');
    expect(markup).toContain('Saved Relationships');
    expect(markup).toContain('Source: Mira Rowan');
    expect(markup).toContain('value="Mira Rowan"');
    expect(markup).toContain(
      'aria-checked="true" aria-label="Directional relationship" role="checkbox"'
    );
  });

  it('renders More with a compact Knowledge Schema overview', () => {
    mockRouteParams = { routeFocusId: 'hidden-detail-cleanup' };
    const documentWithCustomType = updateActiveWorkspace(
      mockMobileCodexController.document,
      (workspace) =>
        createCustomEntryType(workspace, {
          title: 'Artifacts',
          singularTitle: 'Artifact',
          description: 'Objects with worldbuilding importance.',
          fields: 'Origin, Power, Maker, Ward, Age, Cost, Secret',
        })
    );
    const artifactSection = getActiveWorld(
      documentWithCustomType
    ).entryTypes.find((section) => section.id === 'artifacts');
    const artifactEntry = entryFromDraft(artifactSection!, {
      name: 'Glass Key',
      summary: 'A key made of dawn glass.',
      notes: '',
      tags: 'artifact',
      status: 'draft',
      pinned: false,
      details: {
        origin: 'Glassroot Forest',
        power: 'Opens dawn doors',
        maker: 'Dawnwrights',
        ward: 'Harbor seal',
        age: 'Three centuries',
        cost: 'One true name',
        secret: 'Sings at sunrise',
      },
    });
    const documentWithHiddenCustomField = updateActiveWorkspace(
      documentWithCustomType,
      (workspace) => ({
        ...workspace,
        codex: applyEntry(workspace.codex, artifactEntry, workspace.entryTypes),
      })
    );
    const documentWithRemovedFields = updateActiveWorkspace(
      documentWithHiddenCustomField,
      (workspace) =>
        ['power', 'maker', 'ward', 'age', 'cost', 'secret'].reduce(
          (currentWorkspace, fieldKey) =>
            removeCustomEntryTypeField(currentWorkspace, 'artifacts', fieldKey),
          workspace
        )
    );
    const documentWithExpandedVocabulary = updateActiveWorkspace(
      documentWithRemovedFields,
      (workspace) =>
        ['Fey', 'Elemental', 'Dragonkin', 'Celestial'].reduce(
          (currentWorkspace, label) =>
            addVocabularyValue(currentWorkspace, 'character-ancestry', {
              aliases: '',
              description: '',
              label,
            }),
          workspace
        )
    );
    mockMobileCodexController = {
      ...mockMobileCodexController,
      activeWorld: getActiveWorld(documentWithExpandedVocabulary),
      document: documentWithExpandedVocabulary,
      sections: getActiveWorld(documentWithExpandedVocabulary).entryTypes,
    };

    const markup = renderToStaticMarkup(React.createElement(MoreScreen));

    expect(markup).toContain('Knowledge Schema');
    expect(markup.match(/Knowledge Schema/g)).toHaveLength(2);
    expect(markup).toContain('entry types');
    expect(markup).toContain('relationship-backed fields');
    expect(markup).toContain('6 hidden detail cleanup targets');
    expect(markup).toContain('Characters');
    expect(markup).toContain('Open Places');
    expect(markup).toContain('Open Type Setup');
    expect(markup).toContain('Tool shortcuts');
    expect(markup).toContain('Open Data');
    expect(markup).toContain('Open Help');
    expect(markup).toContain('Review hotspots');
    expect(markup).toContain('Open 11 Incomplete Records');
    expect(markup).toContain('aria-label="Open 11 Incomplete Records.');
    expect(markup).toContain(
      'Open the Incomplete Workbench queue before reviewing other record signals.'
    );
    expect(markup).not.toContain(
      'Open 11 Incomplete Records. 11 incomplete records.'
    );
    expect(markup).toContain(
      'aria-label="Open Knowledge Setup. Manage custom entry types, reusable fields, and knowledge structure."'
    );
    expect(markup).toContain('data-testid="more.knowledge-setup"');
    expect(markup).toContain('data-testid="more.data-tools"');
    expect(markup).toContain('data-testid="more.workspaces"');
    expect(markup).toContain('data-testid="more.help"');
    expect(markup).toContain(
      'aria-label="Open Data. Export backups, import JSON, review diagnostics, and reset seeds."'
    );
    expect(markup).toContain(
      'aria-label="Open Workspaces. Manage project/universe workspaces and in-fiction worlds or planets."'
    );
    expect(markup).toContain(
      'aria-label="Open Help. Review workflow guidance, data limits, and local prototype notes."'
    );
    expect(markup).toContain('Open Relationship Review');
    expect(markup).toContain('Open Knowledge Cleanup');
    expect(markup).toContain('Review Cleanup');
    expect(markup).toContain(
      'aria-label="Review 6 hidden detail cleanup targets"'
    );
    expect(markup).toContain('aria-label="Open Type Setup section"');
    expect(markup).toContain('data-testid="more.custom-entry-types"');
    expect(markup).toContain('data-testid="more.field-config"');
    expect(markup).toContain('Field Configuration');
    expect(markup).toContain('Search field settings');
    expect(markup).toContain('Label for Character category in Characters');
    expect(markup).toContain('Help text for Character category in Characters');
    expect(markup).toContain(
      'Hide Character category from editors in Characters'
    );
    expect(markup).toContain('Vocabulary for Character category in Characters');
    expect(markup).toContain(
      'Vocabulary mode for Character category in Characters'
    );
    expect(markup).toContain('Save Field Settings');
    expect(markup).toContain(
      'aria-label="Save Character category settings in Characters"'
    );
    expect(markup).toContain('Default settings');
    expect(markup).toContain('Reset to Defaults');
    expect(markup).toContain(
      'aria-label="Reset Character category settings in Characters to defaults"'
    );
    expect(markup).toContain('Show 3 More Field Sections');
    expect(markup).toContain('Custom entry types');
    expect(markup).toContain('Open Artifacts');
    expect(markup).toContain('aria-label="Open Artifacts records"');
    expect(markup).toContain('Create Entry Type');
    expect(markup).toContain('Add Fields');
    expect(markup).toContain('aria-label="Add fields to Artifacts"');
    expect(markup).toContain('Rename Origin in Artifacts');
    expect(markup).toContain('Save Label');
    expect(markup).toContain('aria-label="Save Origin label in Artifacts"');
    expect(markup).toContain('Move Up');
    expect(markup).toContain('aria-label="Move Origin up in Artifacts"');
    expect(markup).toContain('Move Down');
    expect(markup).toContain('aria-label="Move Origin down in Artifacts"');
    expect(markup).toContain('Remove Field');
    expect(markup).toContain('aria-label="Remove Origin from Artifacts"');
    expect(markup).toContain('aria-label="Delete custom entry type Artifacts"');
    expect(markup).toContain('Add (long) for notes');
    expect(markup).toContain('Open Workspaces');
    expect(markup).toContain('Vocabulary Manager');
    expect(markup).toContain('Manage reusable vocabulary values');
    expect(markup).toContain('Character ancestry');
    expect(markup).toContain(
      'Character ancestry field usage: used by Characters: Ancestry'
    );
    expect(markup).toContain('Search Character ancestry values');
    expect(markup).toContain('Human');
    expect(markup).toContain('Edit Human label');
    expect(markup).toContain('Edit Human description');
    expect(markup).toContain('Edit Human aliases');
    expect(markup).toContain('Save Value');
    expect(markup).toContain('Archive');
    expect(markup).toContain(
      'aria-label="Archive Human from Character ancestry"'
    );
    expect(markup).toContain('aria-label="Save Human in Character ancestry"');
    expect(markup).toContain(
      'aria-label="Move Human up in Character ancestry"'
    );
    expect(markup).toContain(
      'aria-label="Move Human down in Character ancestry"'
    );
    expect(markup).toContain('Restore Monster');
    expect(markup).toContain(
      'aria-label="Restore Monster to Character ancestry"'
    );
    expect(markup).toContain('New Character ancestry value');
    expect(markup).toContain('New Character ancestry description');
    expect(markup).toContain('New Character ancestry aliases');
    expect(markup).toContain('Add Value');
    expect(markup).toContain('aria-label="Add value to Character ancestry"');
    expect(markup).toContain('Search Character ancestry values');
    expect(markup).toContain('Character ancestry field usage');
    expect(markup).toContain(
      'aria-label="Open Characters fields using Character ancestry"'
    );
    expect(markup).toContain('Character ancestry archived values');
    expect(markup).toContain('1 more Character ancestry value.');
    expect(markup).toContain('More Value Rows');
    expect(markup).toContain('Show All');
    expect(markup).toContain('Open Characters');
    expect(markup).toContain('data-testid="more.hidden-detail-cleanup"');
    expect(markup).toContain('Hidden Detail Cleanup');
    expect(markup).toContain('Search hidden details');
    expect(markup).toContain('Entry, field, section, or retained value');
    expect(markup).toContain('Glass Key');
    expect(markup).toContain('Power');
    expect(markup).toContain('Show 1 More Cleanup Row');
    expect(markup).toContain('Clear All Hidden Details');
    expect(markup).toContain('Clear Detail');
    expect(markup).toContain(
      'aria-label="Review Glass Key for hidden detail Power"'
    );
    expect(markup).toContain(
      'aria-label="Clear hidden detail Power from Glass Key"'
    );
    expect(markup).toContain('Review Entry');
    expect(markup).toContain('Reusable Knowledge');
    expect(markup).toContain('Open Factions');
    expect(markup).toContain('aria-label="Open Factions reusable knowledge"');
    expect(markup).toContain('Lore Definition Types');
    expect(markup).toContain('Travel custom');
    expect(markup).toContain('Open Lore');
    expect(markup).toContain('aria-label="Open Lore notes for Travel custom"');
    expect(markup).toContain('involves');
  });
});
