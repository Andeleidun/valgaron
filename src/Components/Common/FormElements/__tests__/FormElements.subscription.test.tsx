import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  baseHandleInputChange,
  createFormStore,
  RenderFormElements,
  type FormElementConfigType,
} from '..';

const renderCounts: Record<string, number> = {};

jest.mock('../ProfileFieldWithPrivacy', () => ({
  ProfileFieldWithPrivacy: ({
    fieldName,
    control,
  }: {
    fieldName?: string;
    control: React.ReactNode;
  }) => {
    const key = fieldName ?? 'unknown';
    renderCounts[key] = (renderCounts[key] ?? 0) + 1;
    return <div data-testid={`field-${key}`}>{control}</div>;
  },
}));

/**
 * Build a small config focused on text-field subscription behavior.
 */
const buildConfig = (): FormElementConfigType[] => [
  {
    type: 'text',
    name: 'firstName',
    label: 'First name',
    value: '',
    id: 'subscription-first-name',
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last name',
    value: '',
    id: 'subscription-last-name',
  },
];

/**
 * Build a small config focused on number-field normalization behavior.
 */
const buildNumberConfig = (): FormElementConfigType[] => [
  {
    type: 'number',
    name: 'age',
    label: 'Age',
    value: 0,
    id: 'subscription-age',
  },
];

describe('RenderFormElements subscriptions', () => {
  beforeEach(() => {
    Object.keys(renderCounts).forEach((key) => {
      delete renderCounts[key];
    });
  });

  test('rerenders only the edited field row when using a form store', () => {
    const store = createFormStore({
      firstName: '',
      lastName: '',
    });

    render(
      <RenderFormElements
        config={buildConfig()}
        handleChange={(event) =>
          store.setValues(baseHandleInputChange(event, store.getValues()))
        }
        handleCheckboxChange={() => undefined}
        handleAutocompleteChange={() => undefined}
        strings={{ add: { en: 'Add', es: 'Agregar', de: 'Hinzufügen' } }}
        language="en"
        store={store}
      />
    );

    expect(renderCounts.firstName).toBe(1);
    expect(renderCounts.lastName).toBe(1);

    fireEvent.change(screen.getByLabelText('First name'), {
      target: { value: 'Ada' },
    });

    expect(renderCounts.firstName).toBe(2);
    expect(renderCounts.lastName).toBe(1);
  });

  test('coerces valid number input values before storing them', () => {
    const store = createFormStore({
      age: 0,
    });

    render(
      <RenderFormElements
        config={buildNumberConfig()}
        handleChange={(event) =>
          store.setValues(baseHandleInputChange(event, store.getValues()))
        }
        handleCheckboxChange={() => undefined}
        handleAutocompleteChange={() => undefined}
        strings={{ add: { en: 'Add', es: 'Agregar', de: 'Hinzufügen' } }}
        language="en"
        store={store}
      />
    );

    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '29' },
    });

    expect(store.getValues().age).toBe(29);

    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '' },
    });

    expect(store.getValues().age).toBe('');
  });
});
