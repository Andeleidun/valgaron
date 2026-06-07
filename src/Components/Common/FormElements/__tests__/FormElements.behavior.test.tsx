import { fireEvent, render, screen } from '@testing-library/react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import type {
  OptionType,
  ProfileFieldPrivacyLevelType,
} from '../../../../types';
import {
  RenderFormElements,
  baseHandleAutocompleteChange,
  baseHandleCheckboxChange,
  baseHandleRepeatingListChange,
  type FormElementConfigType,
} from '../FormElements';
import { createFormStore } from '../FormStore';

type MockInputProps = {
  'aria-label'?: string;
  disabled?: boolean;
  handleChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  label?: string;
  name?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  value?: string | number;
};

type MockAutocompleteProps = {
  addLabel?: string;
  handleChange: (name: string, change: unknown, dataSet?: string) => void;
  label?: string;
  multiple?: boolean;
  name?: string;
  value?: unknown;
};

type MockCheckboxGroupProps = {
  checkedState?: unknown[];
  handleChange: (
    name: string | string[],
    value: OptionType | string,
    dataSet?: string
  ) => void;
  name?: string;
  options?: OptionType[];
  starredState?: unknown[];
};

type MockRadioGroupProps = {
  label?: string;
  name?: string;
  trailingInputLabel?: string;
};

type MockPrivacyWrapperProps = {
  control: ReactNode;
  fieldLabel?: string;
  fieldName?: string;
  handleFieldPrivacyChange?: (
    fieldName: string,
    level: ProfileFieldPrivacyLevelType
  ) => void;
  selectedLevel?: ProfileFieldPrivacyLevelType;
};

const mockAutocompletePropsByName = new Map<string, MockAutocompleteProps>();
const mockCheckboxGroupPropsByName = new Map<string, MockCheckboxGroupProps>();
const mockInputPropsByName = new Map<string, MockInputProps>();
const mockPrivacyPropsByField = new Map<string, MockPrivacyWrapperProps>();
const mockRadioGroupPropsByName = new Map<string, MockRadioGroupProps>();

jest.mock('../..', () => ({
  __esModule: true,
  Autocomplete: (props: MockAutocompleteProps) => {
    const key = props.name ?? 'unnamed-autocomplete';
    mockAutocompletePropsByName.set(key, props);
    return <div data-testid={`autocomplete-${key}`}>{props.label}</div>;
  },
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  CheckboxGroup: (props: MockCheckboxGroupProps) => {
    const key = props.name ?? 'unnamed-checkbox-group';
    mockCheckboxGroupPropsByName.set(key, props);
    return <div data-testid={`checkbox-group-${key}`} />;
  },
  GridItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Input: (props: MockInputProps) => {
    const key = props.name ?? props.label ?? props['aria-label'] ?? 'unnamed';
    mockInputPropsByName.set(key, props);
    return (
      <input
        aria-label={props['aria-label'] ?? props.label}
        disabled={props.disabled}
        name={props.name}
        onChange={(event) =>
          props.handleChange?.(
            event as unknown as ChangeEvent<HTMLInputElement>
          )
        }
        onKeyDown={(event) =>
          props.onKeyDown?.(event as unknown as KeyboardEvent<HTMLInputElement>)
        }
        placeholder={props.placeholder}
        value={props.value ?? ''}
      />
    );
  },
  RadioGroup: (props: MockRadioGroupProps) => {
    const key = props.name ?? 'unnamed-radio-group';
    mockRadioGroupPropsByName.set(key, props);
    return <div data-testid={`radio-group-${key}`}>{props.label}</div>;
  },
  Select: ({
    label,
    name,
    onChange,
    options = [],
    value,
  }: {
    label?: string;
    name?: string;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    options?: OptionType[];
    value?: string;
  }) => (
    <select
      aria-label={label}
      name={name}
      onChange={(event) =>
        onChange?.(event as unknown as ChangeEvent<HTMLInputElement>)
      }
      value={value ?? ''}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {typeof option.label === 'string' ? option.label : option.value}
        </option>
      ))}
    </select>
  ),
  Text: ({
    children,
    role,
  }: {
    children: ReactNode;
    role?: string;
    variant?: string;
  }) => <span role={role}>{children}</span>,
}));

jest.mock('../ProfileFieldWithPrivacy', () => ({
  __esModule: true,
  ProfileFieldWithPrivacy: (props: MockPrivacyWrapperProps) => {
    const key = props.fieldName ?? props.fieldLabel ?? 'unnamed-field';
    mockPrivacyPropsByField.set(key, props);
    return <div data-testid={`field-${key}`}>{props.control}</div>;
  },
}));

const strings = {
  add: { en: 'Add', es: 'Agregar', de: 'Hinzufugen' },
  addFieldTemplate: {
    en: 'Add {{label}}',
    es: 'Agregar {{label}}',
    de: '{{label}} hinzufugen',
  },
  otherPleaseSpecify: {
    en: 'Other, please specify',
    es: 'Otro, por favor especifique',
    de: 'Andere, bitte angeben',
  },
  removeItemTemplate: {
    en: 'Remove {{value}}',
    es: 'Quitar {{value}}',
    de: '{{value}} entfernen',
  },
  starredIntentHelper: {
    en: 'Starred options indicate active intent.',
    es: 'Las opciones marcadas indican una intencion activa.',
    de: 'Markierte Optionen zeigen aktive Absicht an.',
  },
} as const;

const clearCapturedProps = () => {
  mockAutocompletePropsByName.clear();
  mockCheckboxGroupPropsByName.clear();
  mockInputPropsByName.clear();
  mockPrivacyPropsByField.clear();
  mockRadioGroupPropsByName.clear();
};

describe('RenderFormElements targeted behavior', () => {
  beforeEach(() => {
    clearCapturedProps();
  });

  test('normalizes autocomplete values, strips unsupported props, and forwards selections', () => {
    const handleAutocompleteChange = jest.fn();
    const handleFieldPrivacyChange = jest.fn();

    render(
      <RenderFormElements
        config={[
          {
            type: 'autocomplete',
            name: 'skillsArray',
            label: 'Skills',
            value: [
              'Local custom',
              {
                value: 'react',
                label: { en: 'React', es: 'React', de: 'React' },
              },
            ],
            options: [{ value: 'react', label: 'React' }],
            multiple: true,
            trailingInput: true,
          } as FormElementConfigType,
          {
            type: 'autocomplete',
            name: 'skillSingle',
            label: 'Single skill',
            value: {
              value: 'typescript',
              label: {
                en: 'TypeScript',
                es: 'TypeScript',
                de: 'TypeScript',
              },
            },
            options: [{ value: 'typescript', label: 'TypeScript' }],
          },
          {
            type: 'autocomplete',
            name: 'skillString',
            label: 'String skill',
            value: 'Mentoring',
            options: [{ value: 'mentoring', label: 'Mentoring' }],
          },
          {
            type: 'radioGroup',
            name: 'relationshipStyle',
            label: 'Relationship style',
            options: [{ value: 'other', label: 'Other' }],
            trailingInput: true,
            value: 'other',
          },
          {
            type: 'text',
            name: 'headline',
            label: 'Headline',
            value: '',
            trailingInput: true,
            hidePrivacyControl: true,
          } as FormElementConfigType,
        ]}
        handleAutocompleteChange={handleAutocompleteChange}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        handleFieldPrivacyChange={handleFieldPrivacyChange}
        language="en"
        strings={strings}
      />
    );

    const arrayAutocomplete = mockAutocompletePropsByName.get('skillsArray');
    const singleAutocomplete = mockAutocompletePropsByName.get('skillSingle');
    const stringAutocomplete = mockAutocompletePropsByName.get('skillString');
    const radioGroup = mockRadioGroupPropsByName.get('relationshipStyle');
    const headlineInput = mockInputPropsByName.get('headline');
    const headlinePrivacy = mockPrivacyPropsByField.get('headline');

    expect(arrayAutocomplete).toBeDefined();
    expect(arrayAutocomplete?.value).toEqual([
      'Local custom',
      { value: 'react', label: 'React' },
    ]);
    expect(arrayAutocomplete?.addLabel).toBe('Add');
    expect((arrayAutocomplete as Record<string, unknown>).trailingInput).toBe(
      undefined
    );
    expect(singleAutocomplete?.value).toEqual({
      value: 'typescript',
      label: 'TypeScript',
    });
    expect(stringAutocomplete?.value).toBe('Mentoring');
    expect(radioGroup?.trailingInputLabel).toBe('Other, please specify');
    expect((headlineInput as Record<string, unknown>).trailingInput).toBe(
      undefined
    );
    expect(headlinePrivacy?.handleFieldPrivacyChange).toBeUndefined();

    arrayAutocomplete?.handleChange('skillsArray', null, 'ignored-data-set');
    arrayAutocomplete?.handleChange(
      'skillsArray',
      [
        'New skill',
        {
          value: 'react',
          label: { en: 'React', es: 'React', de: 'React' },
        },
      ],
      'profileFormData'
    );
    singleAutocomplete?.handleChange(
      'skillSingle',
      {
        value: 'typescript',
        label: { en: 'TypeScript', es: 'TypeScript', de: 'TypeScript' },
      },
      'profileFormData'
    );

    expect(handleAutocompleteChange).toHaveBeenNthCalledWith(
      1,
      'skillsArray',
      [
        { value: 'New skill', label: 'New skill' },
        { value: 'react', label: 'React' },
      ],
      true,
      'profileFormData'
    );
    expect(handleAutocompleteChange).toHaveBeenNthCalledWith(
      2,
      'skillSingle',
      { value: 'typescript', label: 'TypeScript' },
      false,
      'profileFormData'
    );
  });

  test('reads checkbox store snapshots and forwards checkbox changes', () => {
    const handleCheckboxChange = jest.fn();
    const store = createFormStore({
      dynamicInterests: [{ value: 'music', label: 'Music' }],
      interests: ['Music'],
      starredInterests: ['Music'],
    });

    render(
      <RenderFormElements
        config={[
          {
            type: 'checkboxGroup',
            name: 'interests',
            label: 'Interests',
            checkedState: [],
            options: [{ value: 'fallback', label: 'Fallback' }],
            optionsName: 'dynamicInterests',
            starName: 'starredInterests',
          },
        ]}
        handleAutocompleteChange={jest.fn()}
        handleChange={jest.fn()}
        handleCheckboxChange={handleCheckboxChange}
        language="en"
        store={store}
        strings={strings}
      />
    );

    const checkboxGroup = mockCheckboxGroupPropsByName.get('interests');

    expect(checkboxGroup?.options).toEqual([
      { value: 'music', label: 'Music' },
    ]);
    expect(checkboxGroup?.checkedState).toEqual(['Music']);
    expect(checkboxGroup?.starredState).toEqual(['Music']);

    checkboxGroup?.handleChange('interests', 'Music', 'profileFormData');

    expect(handleCheckboxChange).toHaveBeenCalledWith(
      'interests',
      'Music',
      'profileFormData'
    );
  });

  test('handles repeating lists through button, enter, remove, and missing handlers', () => {
    const handleRepeatingListChange = jest.fn();

    const { rerender } = render(
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
        handleAutocompleteChange={jest.fn()}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        handleRepeatingListChange={handleRepeatingListChange}
        language="en"
        strings={strings}
      />
    );

    fireEvent.change(screen.getByLabelText('Add Goals'), {
      target: { value: '  Mentoring  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add goal' }));

    expect(handleRepeatingListChange).toHaveBeenCalledWith('goals', [
      'Deep work',
      'Mentoring',
    ]);
    expect(screen.getByLabelText('Add Goals')).toHaveValue('');

    rerender(
      <RenderFormElements
        config={[
          {
            type: 'repeatingList',
            name: 'goals',
            label: 'Goals',
            value: ['Deep work'],
          },
        ]}
        handleAutocompleteChange={jest.fn()}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        handleRepeatingListChange={handleRepeatingListChange}
        language="en"
        strings={strings}
      />
    );

    fireEvent.change(screen.getByLabelText('Add Goals'), {
      target: { value: 'Pairing' },
    });
    fireEvent.keyDown(screen.getByLabelText('Add Goals'), { key: 'Enter' });

    expect(handleRepeatingListChange).toHaveBeenCalledWith('goals', [
      'Deep work',
      'Pairing',
    ]);

    rerender(
      <RenderFormElements
        config={[
          {
            type: 'repeatingList',
            name: 'goals',
            label: 'Goals',
            value: ['Deep work', 'Pairing'],
          },
        ]}
        handleAutocompleteChange={jest.fn()}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        handleRepeatingListChange={handleRepeatingListChange}
        language="en"
        strings={strings}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Deep work' }));

    expect(handleRepeatingListChange).toHaveBeenCalledWith('goals', [
      'Pairing',
    ]);

    rerender(
      <RenderFormElements
        config={[
          {
            type: 'repeatingList',
            name: 'goals',
            label: 'Goals',
            value: [],
          },
        ]}
        handleAutocompleteChange={jest.fn()}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        language="en"
        strings={strings}
      />
    );

    fireEvent.change(screen.getByLabelText('Add Goals'), {
      target: { value: 'Ignored' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByLabelText('Add Goals')).toHaveValue('');
  });

  test('ignores empty and unsupported config entries', () => {
    const { container } = render(
      <RenderFormElements
        config={[undefined, { type: 'unsupported' } as FormElementConfigType]}
        handleAutocompleteChange={jest.fn()}
        handleChange={jest.fn()}
        handleCheckboxChange={jest.fn()}
        language="en"
        strings={strings}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Form element helpers', () => {
  test('toggles checkbox and autocomplete values using language-aware matching', () => {
    const englishOption = {
      value: 'english',
      label: { en: 'English', es: 'Ingles', de: 'Englisch' },
    };

    expect(
      baseHandleCheckboxChange(
        'languages',
        englishOption,
        { languages: ['English'] },
        'en'
      )
    ).toEqual({ languages: [] });

    expect(
      baseHandleCheckboxChange(
        'languages',
        'English',
        { languages: [englishOption] },
        'en'
      )
    ).toEqual({ languages: [] });

    expect(
      baseHandleCheckboxChange('languages', englishOption, {}, 'en')
    ).toEqual({
      languages: [englishOption],
    });

    expect(
      baseHandleAutocompleteChange({
        name: 'seeking',
        value: englishOption,
        formData: { seeking: ['English'] },
        language: 'en',
        multi: true,
      })
    ).toEqual({ seeking: [] });

    expect(
      baseHandleAutocompleteChange({
        name: 'seeking',
        value: englishOption,
        formData: { seeking: [] },
        language: 'en',
        multi: false,
      })
    ).toEqual({ seeking: englishOption });
  });

  test('replaces repeating list field values directly', () => {
    expect(
      baseHandleRepeatingListChange('goals', ['Deep work', 'Pairing'], {
        goals: ['Deep work'],
      })
    ).toEqual({
      goals: ['Deep work', 'Pairing'],
    });
  });
});
