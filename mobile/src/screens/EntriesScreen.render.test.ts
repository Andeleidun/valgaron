import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  createEmptyRelationshipDraft,
  createSeedWorldDocument,
  getActiveWorld,
} from '@valgaron/core';
import type { MobileCodexController } from '../state/MobileCodexContext';
import { EntriesScreen } from './EntriesScreen';

type MockNativeProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  children?:
    | React.ReactNode
    | ((state: { pressed: boolean }) => React.ReactNode);
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  visible?: boolean;
};

let mockMobileCodexController: MobileCodexController;

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
    entryId: 'character-mira-rowan',
    intent: 'edit',
    query: 'Mira Rowan',
    sectionId: 'characters',
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
      children,
      disabled,
    }: MockNativeProps) =>
      ReactRuntime.createElement(
        'div',
        {
          'aria-disabled': disabled ? 'true' : undefined,
          'aria-label': accessibilityLabel,
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
    Text: ({ accessibilityRole, children }: MockNativeProps) =>
      ReactRuntime.createElement(
        'span',
        { role: accessibilityRole },
        renderChildren(children)
      ),
    TextInput: ({ accessibilityLabel, placeholder, value }: MockNativeProps) =>
      ReactRuntime.createElement('input', {
        'aria-label': accessibilityLabel,
        defaultValue: value,
        placeholder,
      }),
    View: ({ children }: MockNativeProps) =>
      ReactRuntime.createElement('div', null, renderChildren(children)),
  };
});

function createMockController(): MobileCodexController {
  const document = createSeedWorldDocument();
  const activeWorld = getActiveWorld(document);

  return {
    activeWorld,
    archiveEntry: () => undefined,
    archivePlanetaryWorld: () => undefined,
    archiveWorkspace: () => undefined,
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
  });

  it('renders the direct character edit route with grouped logical-tree fields and linked controls', () => {
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
    expect(markup).toContain('value="Surveyor"');
    expect(markup).toContain('The Cartographers Guild');
    expect(markup).toContain('Legacy Link Text');
    expect(markup).toContain(
      'relationship-backed fields contain saved text that can be reviewed or migrated to relationships.'
    );
    expect(markup).toContain('Unresolved: None. 1 exact match available.');
    expect(markup).toContain('Migrate Exact Matches');
  });
});
