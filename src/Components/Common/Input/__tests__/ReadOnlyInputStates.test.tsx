import { render, screen } from '@testing-library/react';
import { Input, Select, Autocomplete, CheckboxGroup, RadioGroup } from '..';
import { READ_ONLY_DATA_ATTRIBUTE } from '../readOnlyStyles';

/**
 * Build a query selector for the shared readonly data hook.
 */
const readonlySelector = `[${READ_ONLY_DATA_ATTRIBUTE}="true"]`;

describe('Input readonly states', () => {
  test('marks TextInput as readonly with shared data hook', () => {
    render(
      <Input
        label="Name"
        value="Taylor"
        handleChange={() => undefined}
        InputProps={{ readOnly: true }}
      />
    );

    expect(document.querySelector(readonlySelector)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('readonly');
  });

  test('marks Select as readonly with shared data hook', () => {
    render(
      <Select
        label="Role"
        name="role"
        value="member"
        onChange={() => undefined}
        options={[{ value: 'member', label: 'Member' }]}
        language="en"
        inputProps={{ readOnly: true }}
      />
    );

    expect(document.querySelector(readonlySelector)).toBeInTheDocument();
  });

  test('marks Autocomplete as readonly with shared data hook', () => {
    render(
      <Autocomplete
        label="Skills"
        name="skills"
        value="TypeScript"
        options={[{ value: 'typescript', label: 'TypeScript' }]}
        handleChange={() => undefined}
        language="en"
        readOnly
      />
    );

    expect(document.querySelector(readonlySelector)).toBeInTheDocument();
    expect(screen.getByLabelText('Skills')).toHaveAttribute('readonly');
  });

  test('keeps disabled checkbox groups under readonly hook', () => {
    render(
      <CheckboxGroup
        label="Interests"
        name="interests"
        value=""
        options={[{ value: 'music', label: 'Music' }]}
        checkedState={['music']}
        handleChange={() => undefined}
        language="en"
        disabled
      />
    );

    expect(document.querySelector(readonlySelector)).toBeInTheDocument();
    expect(screen.getByLabelText('Music')).toBeDisabled();
  });

  test('keeps disabled radio groups under readonly hook', () => {
    render(
      <RadioGroup
        label="Visibility"
        value="public"
        options={[{ value: 'public', label: 'Public' }]}
        onChange={() => undefined}
        language="en"
        disabled
      />
    );

    expect(document.querySelector(readonlySelector)).toBeInTheDocument();
    expect(screen.getByLabelText('Public')).toBeDisabled();
  });
});
