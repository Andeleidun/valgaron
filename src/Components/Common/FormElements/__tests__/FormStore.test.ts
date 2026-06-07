import { createFormStore, hasSubsetChanged } from '../FormStore';

type TestValuesType = {
  firstName: string;
  lastName: string;
  age: number;
  city?: string;
};

describe('FormStore', () => {
  test('returns stable field snapshots until tracked metadata changes', () => {
    const store = createFormStore<TestValuesType>(
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        age: 36,
      },
      {
        errors: { firstName: 'Required' },
        privacyByField: { firstName: 'open' },
      }
    );

    const initialSnapshot = store.getFieldSnapshot('firstName');

    expect(store.getFieldSnapshot('firstName')).toBe(initialSnapshot);
    expect(store.getValue('firstName')).toBe('Ada');
    expect(store.getError('firstName')).toBe('Required');
    expect(store.getPrivacy('firstName')).toBe('open');

    store.setFieldValue('firstName', 'Grace');

    const afterValueSnapshot = store.getFieldSnapshot('firstName');

    expect(afterValueSnapshot).not.toBe(initialSnapshot);
    expect(afterValueSnapshot).toEqual({
      value: 'Grace',
      error: 'Required',
      privacyLevel: 'open',
    });

    store.setErrors({ firstName: undefined });

    const afterErrorSnapshot = store.getFieldSnapshot('firstName');

    expect(afterErrorSnapshot).not.toBe(afterValueSnapshot);
    expect(afterErrorSnapshot.error).toBeUndefined();
    expect(store.getErrors()).toEqual({ firstName: undefined });

    store.setPrivacy('firstName', 'verified_only');

    const afterPrivacySnapshot = store.getFieldSnapshot('firstName');

    expect(afterPrivacySnapshot).not.toBe(afterErrorSnapshot);
    expect(afterPrivacySnapshot.privacyLevel).toBe('verified_only');
  });

  test('deduplicates multi-field subscriptions and skips unchanged updates', () => {
    const store = createFormStore<TestValuesType>({
      firstName: 'Ada',
      lastName: 'Lovelace',
      age: 36,
    });
    const fieldListener = jest.fn();
    const globalListener = jest.fn();

    const unsubscribeFields = store.subscribeFields(
      ['firstName', 'firstName', 'age'],
      fieldListener
    );
    const unsubscribeAll = store.subscribeAll(globalListener);

    store.setFieldValue('firstName', 'Ada');

    expect(fieldListener).not.toHaveBeenCalled();
    expect(globalListener).not.toHaveBeenCalled();

    store.setValues((currentValues) => ({
      ...currentValues,
      firstName: 'Grace',
      age: 37,
    }));

    expect(fieldListener).toHaveBeenCalledTimes(1);
    expect(globalListener).toHaveBeenCalledTimes(1);
    expect(store.getValues()).toEqual({
      firstName: 'Grace',
      lastName: 'Lovelace',
      age: 37,
    });

    fieldListener.mockClear();
    globalListener.mockClear();

    store.setErrors({ age: 'Too young' });

    expect(fieldListener).toHaveBeenCalledTimes(1);
    expect(globalListener).toHaveBeenCalledTimes(1);

    fieldListener.mockClear();
    globalListener.mockClear();

    store.clearError('lastName');

    expect(fieldListener).not.toHaveBeenCalled();
    expect(globalListener).not.toHaveBeenCalled();

    store.setPrivacy('age', 'connections_only');

    expect(fieldListener).toHaveBeenCalledTimes(1);
    expect(globalListener).toHaveBeenCalledTimes(1);

    unsubscribeFields();
    unsubscribeAll();
  });

  test('returns value subsets and detects relevant shallow changes', () => {
    const store = createFormStore<TestValuesType>({
      firstName: 'Ada',
      lastName: 'Lovelace',
      age: 36,
      city: 'London',
    });
    const subset = store.getValuesSubset(['firstName', 'age']);

    expect(subset).toEqual({ firstName: 'Ada', age: 36 });
    expect(
      hasSubsetChanged(subset, { firstName: 'Ada', age: 36, ignored: true }, [
        'firstName',
        'age',
      ])
    ).toBe(false);
    expect(
      hasSubsetChanged(subset, { firstName: 'Grace', age: 36 }, [
        'firstName',
        'age',
      ])
    ).toBe(true);
  });
});
