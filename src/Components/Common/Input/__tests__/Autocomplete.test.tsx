import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WhoAutocomplete, type AutocompleteOptionsType } from '../Autocomplete';
import { READ_ONLY_DATA_ATTRIBUTE } from '../readOnlyStyles';

type MockAutocompleteChangeValue =
  | string
  | AutocompleteOptionsType
  | Array<string | AutocompleteOptionsType>
  | null;

type MockOptionRenderProps = React.HTMLAttributes<HTMLLIElement> & {
  key: string;
};

type MockBaseAutocompleteProps = {
  value: MockAutocompleteChangeValue;
  options: AutocompleteOptionsType[];
  multiple?: boolean;
  readOnly?: boolean;
  className?: string;
  onChange: (
    event: React.SyntheticEvent | null,
    value: MockAutocompleteChangeValue
  ) => void;
  isOptionEqualToValue: (
    option: AutocompleteOptionsType | string,
    compareValue: AutocompleteOptionsType | string
  ) => boolean;
  filterOptions: (
    options: AutocompleteOptionsType[],
    params: {
      inputValue: string;
      getOptionLabel: (option: AutocompleteOptionsType | string) => string;
    }
  ) => AutocompleteOptionsType[];
  getOptionLabel: (option: AutocompleteOptionsType | string) => string;
  renderOption: (
    props: MockOptionRenderProps,
    option: AutocompleteOptionsType
  ) => React.ReactNode;
  renderInput: (params: {
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    InputProps: { readOnly?: boolean };
  }) => React.ReactNode;
  renderTags?: (
    value: Array<AutocompleteOptionsType | string>,
    getTagProps: (args: { index: number }) => { key: string }
  ) => React.ReactNode;
};

jest.mock('@mui/material/', () => {
  const actual = jest.requireActual('@mui/material/');

  /**
   * Minimal MUI Autocomplete test double that exposes wrapper callbacks.
   */
  const MockAutocomplete = ({
    value,
    options,
    multiple,
    onChange,
    isOptionEqualToValue,
    filterOptions,
    getOptionLabel,
    renderOption,
    renderInput,
    renderTags,
  }: MockBaseAutocompleteProps) => {
    const addSuggestionResults = filterOptions(options, {
      inputValue: 'Karaoke',
      getOptionLabel,
    });
    const existingValueResults = filterOptions(options, {
      inputValue: 'TypeScript',
      getOptionLabel,
    });

    return (
      <div>
        <div data-testid="normalized-value">{JSON.stringify(value)}</div>
        <div data-testid="option-labels">
          {options.map((option) => getOptionLabel(option)).join('|')}
        </div>
        <div data-testid="string-equality">
          {String(isOptionEqualToValue(' TypeScript ', 'typescript'))}
        </div>
        <div data-testid="label-equality">
          {String(
            isOptionEqualToValue({ label: 'Remote' }, { label: 'remote' })
          )}
        </div>
        <div data-testid="string-label">{getOptionLabel('typescript')}</div>
        <div data-testid="input-value-label">
          {getOptionLabel({ inputValue: 'Portland' })}
        </div>
        <div data-testid="value-fallback-label">
          {getOptionLabel({ value: 'custom' })}
        </div>
        <div data-testid="empty-label">{getOptionLabel({}) || '(empty)'}</div>
        <div data-testid="render-input-slot">
          {renderInput({ inputProps: {}, InputProps: {} })}
        </div>
        <div data-testid="render-tags-slot">
          {multiple && Array.isArray(value) && renderTags
            ? renderTags(value, ({ index }) => ({
                key: `tag-${index}`,
              }))
            : null}
        </div>
        <ul data-testid="filtered-karaoke">
          {addSuggestionResults.map((option, index) =>
            renderOption({ key: `filtered-karaoke-${index}` }, option)
          )}
        </ul>
        <ul data-testid="filtered-typescript">
          {existingValueResults.map((option, index) =>
            renderOption({ key: `filtered-typescript-${index}` }, option)
          )}
        </ul>
        <button
          type="button"
          onClick={() =>
            onChange(null, [
              'typescript',
              { inputValue: 'Portland' },
              { value: 'custom' },
            ])
          }
        >
          Trigger array change
        </button>
        <button type="button" onClick={() => onChange(null, 'New Skill')}>
          Trigger string change
        </button>
        <button
          type="button"
          onClick={() => onChange(null, { inputValue: 'Seattle' })}
        >
          Trigger inputValue change
        </button>
        <button
          type="button"
          onClick={() => onChange(null, { value: 'remote' })}
        >
          Trigger option change
        </button>
        <button type="button" onClick={() => onChange(null, null)}>
          Trigger null change
        </button>
      </div>
    );
  };

  return {
    ...actual,
    Autocomplete: MockAutocomplete,
  };
});

/**
 * Render a wrapper instance with stable defaults for focused assertions.
 */
const renderAutocomplete = (
  overrides: Partial<React.ComponentProps<typeof WhoAutocomplete>> = {}
) => {
  const handleChange = jest.fn();
  const view = render(
    <WhoAutocomplete
      name="skills"
      label="Skills"
      language="en"
      options={[
        { value: 'typescript', label: 'TypeScript' },
        { value: 'remote', label: 'Remote' },
      ]}
      handleChange={handleChange}
      {...overrides}
    />
  );

  return {
    ...view,
    handleChange,
  };
};

describe('WhoAutocomplete', () => {
  test('normalizes multiple values, backfills missing selections, and resolves tag labels', async () => {
    const { rerender } = renderAutocomplete({
      multiple: true,
      value: 'TypeScript',
    });

    expect(screen.getByTestId('normalized-value')).toHaveTextContent(
      '["TypeScript"]'
    );

    rerender(
      <WhoAutocomplete
        name="skills"
        label="Skills"
        language="en"
        multiple
        options={[
          { value: 'typescript', label: 'TypeScript' },
          { value: 'remote', label: 'Remote' },
        ]}
        value={[
          'TypeScript',
          { value: 'custom' },
          { inputValue: 'Portland' },
          { label: 'Only label' },
          {},
        ]}
        addLabel="Add"
        handleChange={() => undefined}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('option-labels')).toHaveTextContent(
        'TypeScript|Remote|custom|Portland|Only label'
      );
    });

    expect(screen.getByTestId('string-equality')).toHaveTextContent('true');
    expect(screen.getByTestId('label-equality')).toHaveTextContent('true');
    expect(screen.getByTestId('string-label')).toHaveTextContent('TypeScript');
    expect(screen.getByTestId('input-value-label')).toHaveTextContent(
      'Portland'
    );
    expect(screen.getByTestId('value-fallback-label')).toHaveTextContent(
      'custom'
    );
    expect(screen.getByTestId('empty-label')).toHaveTextContent('(empty)');

    expect(screen.getByTestId('render-tags-slot')).toHaveTextContent(
      'TypeScript'
    );
    expect(screen.getByTestId('render-tags-slot')).toHaveTextContent('custom');
    expect(screen.getByTestId('render-tags-slot')).toHaveTextContent(
      'Portland'
    );
    expect(screen.getByTestId('render-tags-slot')).toHaveTextContent(
      'Only label'
    );

    rerender(
      <WhoAutocomplete
        name="skills"
        label="Skills"
        language="en"
        multiple
        options={[
          { value: 'typescript', label: 'TypeScript' },
          { value: 'remote', label: 'Remote' },
        ]}
        value={null}
        handleChange={() => undefined}
      />
    );

    expect(screen.getByTestId('normalized-value')).toHaveTextContent('[]');
  });

  test('normalizes every supported change payload before invoking handleChange', () => {
    const { handleChange } = renderAutocomplete({
      value: { value: 'typescript' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Trigger array change' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Trigger string change' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Trigger inputValue change' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Trigger option change' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Trigger null change' })
    );

    expect(handleChange).toHaveBeenNthCalledWith(1, 'skills', [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'Portland', label: 'Portland' },
      { value: 'custom', label: 'custom' },
    ]);
    expect(handleChange).toHaveBeenNthCalledWith(2, 'skills', {
      value: 'New Skill',
      label: 'New Skill',
    });
    expect(handleChange).toHaveBeenNthCalledWith(3, 'skills', {
      value: 'Seattle',
      label: 'Seattle',
    });
    expect(handleChange).toHaveBeenNthCalledWith(4, 'skills', {
      value: 'remote',
      label: 'Remote',
    });
    expect(handleChange).toHaveBeenNthCalledWith(5, 'skills', null);
  });

  test('adds a create suggestion for new values without duplicating existing labels', () => {
    renderAutocomplete({
      value: { value: 'typescript' },
      addLabel: 'Add',
    });

    expect(screen.getByTestId('filtered-karaoke')).toHaveTextContent(
      'Add Karaoke'
    );
    expect(screen.getByTestId('filtered-typescript')).toHaveTextContent(
      'TypeScript'
    );
    expect(screen.getByTestId('filtered-typescript')).not.toHaveTextContent(
      'Add TypeScript'
    );
  });

  test('forwards readonly, helper, and error metadata to the rendered input', () => {
    renderAutocomplete({
      value: { value: 'typescript' },
      InputProps: { readOnly: true },
      error: true,
      helperText: 'Use up to five skills',
    });

    expect(
      document.querySelector(`[${READ_ONLY_DATA_ATTRIBUTE}="true"]`)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Skills')).toHaveAttribute('readonly');
    expect(screen.getByText('Use up to five skills')).toBeInTheDocument();
  });
});
