import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, jest } from '@jest/globals';
import { HelpScreen } from './HelpScreen';

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

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const renderChildren = (children: MockNativeProps['children']) =>
    typeof children === 'function' ? children({ pressed: false }) : children;

  return {
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

describe('HelpScreen render smoke', () => {
  it('renders shared character-tree guidance on mobile', () => {
    const markup = renderToStaticMarkup(React.createElement(HelpScreen));

    expect(markup).toContain('Build the codex');
    expect(markup).toContain('Open Knowledge');
    expect(markup).toContain('Open Utilities');
    expect(markup).toContain(
      'Use Knowledge or mobile More to create custom entry types'
    );
    expect(markup).toContain('observed flexible values');
    expect(markup).toContain(
      'Use character category to shape which character fields appear'
    );
    expect(markup).toContain(
      'ancestry and profession stay flexible creator-authored values'
    );
    expect(markup).toContain('Connect records');
    expect(markup).toContain('Use relationship-backed character fields');
    expect(markup).toContain('visible from both sides');
    expect(markup).toContain('related lore');
    expect(markup).not.toContain('origins, forms, and notable events');
  });
});
