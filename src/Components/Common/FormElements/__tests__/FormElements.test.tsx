import { fireEvent, render, screen } from '@testing-library/react';
import {
  RenderFormElements,
  baseHandleAutocompleteChange,
  type FormElementConfigType,
} from '../FormElements';

/**
 * Build a complete field set for renderer coverage.
 */
const buildConfig = (): FormElementConfigType[] => [
  {
    type: 'text',
    name: 'fullName',
    label: 'Full name',
    value: '',
    id: 'test-text-field',
  },
  {
    type: 'number',
    name: 'age',
    label: 'Age',
    value: 0,
    id: 'test-number-field',
  },
  {
    type: 'select',
    name: 'role',
    label: 'Role',
    value: 'member',
    options: [
      { value: 'member', label: 'Member' },
      { value: 'admin', label: 'Admin' },
    ],
    id: 'test-select-field',
  },
  {
    type: 'radioGroup',
    name: 'visibility',
    label: 'Visibility',
    value: 'public',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
    id: 'test-radio-field',
  },
  {
    type: 'autocomplete',
    name: 'skills',
    label: 'Skills',
    value: [],
    multiple: true,
    options: [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'react', label: 'React' },
    ],
    id: 'test-autocomplete-field',
  },
  {
    type: 'checkboxGroup',
    name: 'interests',
    label: 'Interests',
    checkedState: [],
    options: [
      { value: 'music', label: 'Music' },
      { value: 'sports', label: 'Sports' },
    ],
    id: 'test-checkbox-group',
  },
  {
    type: 'button',
    name: 'save',
    children: 'Save',
    id: 'test-save-button',
  },
];

describe('RenderFormElements', () => {
  test('renders all supported field types', async () => {
    const handleChange = jest.fn();
    const handleCheckboxChange = jest.fn();
    const handleAutocompleteChange = jest.fn();

    render(
      <RenderFormElements
        config={buildConfig()}
        handleChange={handleChange}
        handleCheckboxChange={handleCheckboxChange}
        handleAutocompleteChange={handleAutocompleteChange}
        strings={{ add: { en: 'Add', es: 'Agregar', de: 'Hinzufügen' } }}
        language="en"
      />
    );

    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(screen.getByLabelText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'A' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  test('uses translated add and remove aria labels for repeating lists', () => {
    render(
      <RenderFormElements
        config={[
          {
            type: 'repeatingList',
            name: 'goals',
            label: 'Goals',
            value: ['Deep work'],
            addLabel: 'Add goal',
          },
        ]}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        handleAutocompleteChange={jest.fn()}
        handleRepeatingListChange={jest.fn()}
        strings={{
          add: { en: 'Add', es: 'Agregar', de: 'Hinzufügen' },
          addFieldTemplate: {
            en: 'Add {{label}}',
            es: 'Agregar {{label}}',
            de: '{{label}} hinzufügen',
          },
          removeItemTemplate: {
            en: 'Remove {{value}}',
            es: 'Quitar {{value}}',
            de: '{{value}} entfernen',
          },
        }}
        language="en"
      />
    );

    expect(screen.getByLabelText('Add Goals')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Deep work' })
    ).toBeInTheDocument();
  });

  test('renders field privacy controls and starred intent helper', () => {
    const handleChange = jest.fn();
    const handleCheckboxChange = jest.fn();
    const handleAutocompleteChange = jest.fn();
    const handleFieldPrivacyChange = jest.fn();

    render(
      <RenderFormElements
        config={[
          {
            type: 'text',
            name: 'bio',
            label: 'Bio',
            value: '',
          },
          {
            type: 'checkboxGroup',
            name: 'interests',
            label: 'Interests',
            options: [{ value: 'music', label: 'Music' }],
            checkedState: [],
            starName: 'starredInterests',
            error: true,
            helperText: 'Select at least one interest.',
          },
        ]}
        handleChange={handleChange}
        handleCheckboxChange={handleCheckboxChange}
        handleAutocompleteChange={handleAutocompleteChange}
        handleFieldPrivacyChange={handleFieldPrivacyChange}
        privacyByField={{ bio: 'open', interests: 'verified_only' }}
        strings={{
          add: { en: 'Add', es: 'Agregar', de: 'Hinzufügen' },
          privacyVisibility: {
            en: 'Field visibility',
            es: 'Visibilidad de campo',
            de: 'Feldsichtbarkeit',
          },
          privacyOpen: { en: 'Open', es: 'Abierto', de: 'Offen' },
          privacyConnectionsOnly: {
            en: 'Connections only',
            es: 'Solo conexiones',
            de: 'Nur Verbindungen',
          },
          privacyVerifiedOnly: {
            en: 'Verified users only',
            es: 'Solo usuarios verificados',
            de: 'Nur verifizierte Nutzer',
          },
          starredIntentHelper: {
            en: 'Starred options indicate active intent.',
            es: 'Las opciones destacadas indican intención activa.',
            de: 'Markierte Optionen zeigen aktive Absicht an.',
          },
        }}
        language="en"
      />
    );

    expect(screen.getByLabelText('Field visibility: Bio')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Field visibility: Interests')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Starred options indicate active intent.')
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select at least one interest.'
    );
  });

  test('uses paired field-and-visibility layout for standard fields and checkbox groups', () => {
    const handleChange = jest.fn();
    const handleCheckboxChange = jest.fn();
    const handleAutocompleteChange = jest.fn();
    const handleFieldPrivacyChange = jest.fn();

    const { container } = render(
      <RenderFormElements
        config={[
          {
            type: 'text',
            name: 'bio',
            label: 'Bio',
            value: '',
          },
          {
            type: 'checkboxGroup',
            name: 'interests',
            label: 'Interests',
            options: [{ value: 'music', label: 'Music' }],
            checkedState: [],
          },
        ]}
        handleChange={handleChange}
        handleCheckboxChange={handleCheckboxChange}
        handleAutocompleteChange={handleAutocompleteChange}
        handleFieldPrivacyChange={handleFieldPrivacyChange}
        privacyByField={{ bio: 'open', interests: 'verified_only' }}
        strings={{
          add: { en: 'Add', es: 'Agregar', de: 'Hinzufügen' },
          privacyVisibility: {
            en: 'Field visibility',
            es: 'Visibilidad de campo',
            de: 'Feldsichtbarkeit',
          },
          privacyOpen: { en: 'Open', es: 'Abierto', de: 'Offen' },
          privacyConnectionsOnly: {
            en: 'Connections only',
            es: 'Solo conexiones',
            de: 'Nur Verbindungen',
          },
          privacyVerifiedOnly: {
            en: 'Verified users only',
            es: 'Solo usuarios verificados',
            de: 'Nur verifizierte Nutzer',
          },
        }}
        language="en"
      />
    );

    const bioWrapper = screen.getByTestId('field-with-privacy-bio');
    const interestsWrapper = screen.getByTestId('field-with-privacy-interests');

    expect(bioWrapper).toBeInTheDocument();
    expect(interestsWrapper).toBeInTheDocument();
    expect(
      container.querySelector(
        '[data-testid="field-with-privacy-bio"] [class*="MuiGrid2-grid-xs-8"]'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="field-with-privacy-bio"] [class*="MuiGrid2-grid-xs-4"]'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="field-with-privacy-interests"] [class*="MuiGrid2-grid-xs-8"]'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '[data-testid="field-with-privacy-interests"] [class*="MuiGrid2-grid-xs-4"]'
      )
    ).not.toBeNull();
  });

  test('replaces multi-select autocomplete values with the full selection array', () => {
    const updatedValues = baseHandleAutocompleteChange({
      name: 'seeking',
      value: [
        { value: 'long_term_relationship', label: 'Long-term relationship' },
        { value: 'new_friends', label: 'New friends' },
      ],
      formData: {
        seeking: [{ value: 'casual_dates', label: 'Casual dates' }],
      },
      multi: true,
      language: 'en',
    });

    expect(updatedValues).toEqual({
      seeking: [
        { value: 'long_term_relationship', label: 'Long-term relationship' },
        { value: 'new_friends', label: 'New friends' },
      ],
    });
  });
});
