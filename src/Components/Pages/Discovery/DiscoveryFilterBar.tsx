import { Box, Grid, GridItem, Input, Autocomplete, Select } from '../../Common';
import { returnStringOrValue } from '../../../Utlilities';
import type {
  OptionType,
  discoveryTranslationStringsType,
} from '../../../types';
import type { AutocompleteOptionsType } from '../../Common/Input/Autocomplete';

/**
 * Sort options supported by Discovery.
 */
export type DiscoverySortOption = '' | 'name' | 'recent' | 'membersCount';

/**
 * Discovery filter state.
 */
export type DiscoveryFilters = {
  searchText: string;
  tags: string[];
  modeSpecific: string;
  availabilityPattern: string;
  communicationPace: string;
  introductionPreference: string;
  languageComfort: string;
  planningStyle: string;
};

/**
 * Select-based discovery filter keys rendered by the shared filter bar.
 */
export type DiscoveryFilterKey = Exclude<
  keyof DiscoveryFilters,
  'searchText' | 'tags'
>;

/**
 * Configuration for one select-based discovery filter.
 */
export type DiscoverySelectFilterConfig = {
  key: DiscoveryFilterKey;
  label: string;
  options: OptionType[];
};

/**
 * Props for DiscoveryFilterBar.
 */
type DiscoveryFilterBarProps = {
  language: string;
  strings: discoveryTranslationStringsType;
  filters: DiscoveryFilters;
  sortOption: DiscoverySortOption;
  tagOptions: string[];
  selectFilters: DiscoverySelectFilterConfig[];
  onFiltersChange: (next: Partial<DiscoveryFilters>) => void;
  onSortChange: (next: DiscoverySortOption) => void;
};

/**
 * Build Select options from string values.
 */
const buildOptions = (options: string[]): OptionType[] =>
  options
    .filter((option) => option.length > 0)
    .map((option) => ({
      value: option,
      label: option,
    }));

/**
 * Prefix select options with a reversible placeholder entry.
 */
const withPlaceholderOption = (
  label: string,
  options: OptionType[]
): OptionType[] => [
  { value: '', label },
  ...options.filter((option) => option.value !== ''),
];

/**
 * Render the Discovery filters and sorting controls.
 */
const DiscoveryFilterBar = ({
  language,
  strings,
  filters,
  sortOption,
  tagOptions,
  selectFilters,
  onFiltersChange,
  onSortChange,
}: DiscoveryFilterBarProps) => {
  const sortOptions: OptionType[] = [
    { value: '', label: strings.sortLabel[language] },
    { value: 'name', label: strings.sortName[language] },
    { value: 'recent', label: strings.sortRecent[language] },
    { value: 'membersCount', label: strings.sortMembers[language] },
  ];
  const handleTagsChange = (
    _name: string,
    change: AutocompleteOptionsType | AutocompleteOptionsType[] | null
  ) => {
    if (!change) {
      onFiltersChange({ tags: [] });
      return;
    }
    const changes = Array.isArray(change) ? change : [change];
    const nextTags = changes
      .map(
        (option) => option.value ?? returnStringOrValue(language, option.label)
      )
      .filter((value) => value.length > 0);
    onFiltersChange({ tags: nextTags });
  };

  const handleSelectFilterChange = (key: DiscoveryFilterKey, value: string) => {
    onFiltersChange({ [key]: value } as Partial<DiscoveryFilters>);
  };

  return (
    <Grid spacing={2} alignItems="stretch">
      <GridItem xs={12} md={6}>
        <Box sx={{ width: '100%' }}>
          <Input
            label={strings.searchLabel[language]}
            name="searchText"
            value={filters.searchText}
            handleChange={(event) =>
              onFiltersChange({ searchText: event.target.value })
            }
            placeholder={strings.searchLabel[language]}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            fullWidth
          />
        </Box>
      </GridItem>
      <GridItem xs={12} md={6}>
        <Box sx={{ width: '100%' }}>
          <Autocomplete
            label={strings.tagsLabel}
            language={language}
            options={buildOptions(tagOptions)}
            value={filters.tags.map((tag) => ({ value: tag, label: tag }))}
            handleChange={handleTagsChange}
            name="tags"
            multiple
          />
        </Box>
      </GridItem>
      {selectFilters.map((filter) => (
        <GridItem xs={12} md={6} key={filter.key}>
          <Box sx={{ width: '100%' }}>
            <Select
              label={filter.label}
              language={language}
              value={filters[filter.key]}
              onChange={(event) =>
                handleSelectFilterChange(
                  filter.key,
                  `${event.target.value ?? ''}`
                )
              }
              options={withPlaceholderOption(filter.label, filter.options)}
            />
          </Box>
        </GridItem>
      ))}
      <GridItem xs={12} md={6}>
        <Box sx={{ width: '100%' }}>
          <Select
            label={strings.sortLabel[language]}
            language={language}
            value={sortOption}
            onChange={(event) =>
              onSortChange(event.target.value as DiscoverySortOption)
            }
            options={sortOptions}
          />
        </Box>
      </GridItem>
    </Grid>
  );
};

export default DiscoveryFilterBar;
