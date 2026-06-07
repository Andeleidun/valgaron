import type { ChangeEvent, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import DiscoveryFilterBar from './DiscoveryFilterBar';
import { fetchTranslations } from '../../../Utlilities';
import type {
  DiscoveryFilters,
  DiscoverySelectFilterConfig,
} from './DiscoveryFilterBar';

type MockOption = {
  value?: string;
  label?: string | { en: string; es?: string };
};

type MockInputProps = {
  label: string;
  name: string;
  value: string;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type MockAutocompleteProps = {
  label?: string | { en: string; es?: string };
  name?: string;
  handleChange: (
    name: string,
    change: MockOption | MockOption[] | null
  ) => void;
};

type MockSelectProps = {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{
    value: string;
    label: string | { en: string; es?: string };
  }>;
};

jest.mock('../../Common', () => ({
  Box: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Grid: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  GridItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Input: ({ label, name, value, handleChange }: MockInputProps) => (
    <input
      aria-label={label}
      name={name}
      value={value}
      onChange={handleChange}
    />
  ),
  Autocomplete: ({
    label = 'tags',
    name = 'tags',
    handleChange,
  }: MockAutocompleteProps) => {
    const resolvedLabel = typeof label === 'string' ? label : label.en;

    return (
      <div>
        <button
          type="button"
          onClick={() =>
            handleChange(name, [{ value: 'music', label: 'music' }])
          }
        >
          {`${resolvedLabel}-array`}
        </button>
        <button
          type="button"
          onClick={() => handleChange(name, { label: 'outdoors' })}
        >
          {`${resolvedLabel}-single`}
        </button>
        <button type="button" onClick={() => handleChange(name, null)}>
          {`${resolvedLabel}-clear`}
        </button>
      </div>
    );
  },
  Select: ({ label, value, onChange, options }: MockSelectProps) => (
    <select aria-label={label} value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {typeof option.label === 'string' ? option.label : option.label.en}
        </option>
      ))}
    </select>
  ),
}));

const translations = fetchTranslations();
const discoveryStrings = translations.discovery.dating;
const connectionStyleStrings = translations.connectionStyle.dating;
const baseFilters: DiscoveryFilters = {
  searchText: '',
  tags: [],
  modeSpecific: '',
  availabilityPattern: '',
  communicationPace: '',
  introductionPreference: '',
  languageComfort: '',
  planningStyle: '',
};
const baseSelectFilters: DiscoverySelectFilterConfig[] = [
  {
    key: 'modeSpecific',
    label: discoveryStrings.modeSpecificLabel.en,
    options: [
      { value: '', label: '' },
      { value: 'nearby', label: 'nearby' },
      { value: 'campus', label: 'campus' },
    ],
  },
  {
    key: 'availabilityPattern',
    label: connectionStyleStrings.availabilityPattern.title.en,
    options: [{ value: 'weekends', label: 'Weekends' }],
  },
];

describe('DiscoveryFilterBar', () => {
  test('forwards search, tag, and select-filter changes', () => {
    const onFiltersChange = jest.fn();
    const onSortChange = jest.fn();

    render(
      <DiscoveryFilterBar
        language="en"
        strings={discoveryStrings}
        filters={baseFilters}
        sortOption=""
        tagOptions={['music', '', 'art']}
        selectFilters={baseSelectFilters}
        onFiltersChange={onFiltersChange}
        onSortChange={onSortChange}
      />
    );

    fireEvent.change(
      screen.getByRole('textbox', {
        name: discoveryStrings.searchLabel.en,
      }),
      { target: { value: 'Taylor' } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: `${discoveryStrings.tagsLabel.en}-array`,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: `${discoveryStrings.tagsLabel.en}-single`,
      })
    );
    fireEvent.change(
      screen.getByRole('combobox', {
        name: discoveryStrings.modeSpecificLabel.en,
      }),
      { target: { value: 'nearby' } }
    );
    fireEvent.change(
      screen.getByRole('combobox', {
        name: connectionStyleStrings.availabilityPattern.title.en,
      }),
      { target: { value: 'weekends' } }
    );
    fireEvent.change(
      screen.getByRole('combobox', {
        name: discoveryStrings.sortLabel.en,
      }),
      { target: { value: 'recent' } }
    );

    expect(onFiltersChange).toHaveBeenNthCalledWith(1, {
      searchText: 'Taylor',
    });
    expect(onFiltersChange).toHaveBeenNthCalledWith(2, { tags: ['music'] });
    expect(onFiltersChange).toHaveBeenNthCalledWith(3, { tags: ['outdoors'] });
    expect(onFiltersChange).toHaveBeenNthCalledWith(4, {
      modeSpecific: 'nearby',
    });
    expect(onFiltersChange).toHaveBeenNthCalledWith(5, {
      availabilityPattern: 'weekends',
    });
    expect(onSortChange).toHaveBeenCalledWith('recent');
  });

  test('clears tags and keeps placeholder options for reversible selects', () => {
    const onFiltersChange = jest.fn();

    render(
      <DiscoveryFilterBar
        language="en"
        strings={discoveryStrings}
        filters={{ ...baseFilters, tags: ['music'] }}
        sortOption=""
        tagOptions={['music']}
        selectFilters={[
          {
            key: 'modeSpecific',
            label: discoveryStrings.modeSpecificLabel.en,
            options: [
              { value: '', label: '' },
              { value: 'campus', label: 'campus' },
            ],
          },
        ]}
        onFiltersChange={onFiltersChange}
        onSortChange={jest.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: `${discoveryStrings.tagsLabel.en}-clear`,
      })
    );

    const modeSpecificSelect = screen.getByRole('combobox', {
      name: discoveryStrings.modeSpecificLabel.en,
    });
    const emptyOption = Array.from(
      modeSpecificSelect.querySelectorAll('option')
    ).find((option) => option.value === '');

    expect(onFiltersChange).toHaveBeenCalledWith({ tags: [] });
    expect(emptyOption).toBeDefined();
    expect(emptyOption?.textContent).toBe(
      discoveryStrings.modeSpecificLabel.en
    );
  });
});
