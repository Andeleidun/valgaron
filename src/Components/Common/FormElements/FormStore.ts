import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { ProfileFieldPrivacyLevelType } from '../../../types';
import type { FormDataRecord } from './FormElements';

type Listener = () => void;

/**
 * Snapshot exposed to a single form field row.
 */
export type FormFieldSnapshotType = {
  value: unknown;
  error?: string;
  privacyLevel?: ProfileFieldPrivacyLevelType;
};

const EMPTY_FIELD_SNAPSHOT: FormFieldSnapshotType = {
  value: undefined,
  error: undefined,
  privacyLevel: undefined,
};

type FormStoreOptionsType = {
  errors?: Record<string, string | undefined>;
  privacyByField?: Record<string, ProfileFieldPrivacyLevelType>;
};

/**
 * Shared store contract for dynamic form values, validation errors, and
 * profile-field privacy settings.
 */
export type FormStoreType<T extends FormDataRecord> = {
  clearError: (fieldName: string) => void;
  getError: (fieldName: string) => string | undefined;
  getErrors: () => Record<string, string | undefined>;
  getFieldSnapshot: (fieldName: string) => FormFieldSnapshotType;
  getPrivacy: (fieldName: string) => ProfileFieldPrivacyLevelType | undefined;
  getValue: (fieldName: string) => unknown;
  getValues: () => T;
  getValuesSubset: (fieldNames: string[]) => Record<string, unknown>;
  setErrors: (errors: Record<string, string | undefined>) => void;
  setFieldValue: <K extends keyof T & string>(
    fieldName: K,
    value: T[K]
  ) => void;
  setPrivacy: (fieldName: string, level: ProfileFieldPrivacyLevelType) => void;
  setValues: (nextValues: T | ((currentValues: T) => T)) => void;
  subscribeAll: (listener: Listener) => () => void;
  subscribeField: (fieldName: string, listener: Listener) => () => void;
  subscribeFields: (fieldNames: string[], listener: Listener) => () => void;
};

/**
 * Read-only subset used by renderer consumers that only subscribe to field
 * snapshots.
 */
export type FormStoreSubscriberType<T extends FormDataRecord> = Pick<
  FormStoreType<T>,
  'getFieldSnapshot' | 'subscribeField'
>;

type InternalStateType<T extends FormDataRecord> = {
  errors: Record<string, string | undefined>;
  privacyByField: Record<string, ProfileFieldPrivacyLevelType>;
  values: T;
};

/**
 * Check whether two records differ for at least one key in the provided list.
 */
const didKeysChange = (
  previousRecord: Record<string, unknown>,
  nextRecord: Record<string, unknown>,
  keys: string[]
): boolean =>
  keys.some((key) => !Object.is(previousRecord[key], nextRecord[key]));

/**
 * Return the union of keys from the compared records.
 */
const getChangedKeys = (
  previousRecord: Record<string, unknown>,
  nextRecord: Record<string, unknown>
): string[] => {
  const keys = new Set([
    ...Object.keys(previousRecord),
    ...Object.keys(nextRecord),
  ]);
  return [...keys].filter(
    (key) => !Object.is(previousRecord[key], nextRecord[key])
  );
};

/**
 * Create a mutable external store for form values and metadata.
 */
export const createFormStore = <T extends FormDataRecord>(
  initialValues: T,
  options: FormStoreOptionsType = {}
): FormStoreType<T> => {
  const fieldListeners = new Map<string, Set<Listener>>();
  const fieldSnapshotCache = new Map<string, FormFieldSnapshotType>();
  const globalListeners = new Set<Listener>();
  let state: InternalStateType<T> = {
    values: initialValues,
    errors: options.errors ?? {},
    privacyByField: options.privacyByField ?? {},
  };

  /**
   * Notify subscribers that depend on the provided field names.
   */
  const notifyFields = (fieldNames: string[]) => {
    const notified = new Set<Listener>();
    fieldNames.forEach((fieldName) => {
      fieldListeners.get(fieldName)?.forEach((listener) => {
        if (notified.has(listener)) {
          return;
        }
        notified.add(listener);
        listener();
      });
    });
    globalListeners.forEach((listener) => {
      if (notified.has(listener)) {
        return;
      }
      notified.add(listener);
      listener();
    });
  };

  /**
   * Track one listener against one field name.
   */
  const subscribeField = (fieldName: string, listener: Listener) => {
    const listeners = fieldListeners.get(fieldName) ?? new Set<Listener>();
    listeners.add(listener);
    fieldListeners.set(fieldName, listeners);
    return () => {
      const currentListeners = fieldListeners.get(fieldName);
      if (!currentListeners) {
        return;
      }
      currentListeners.delete(listener);
      if (currentListeners.size === 0) {
        fieldListeners.delete(fieldName);
      }
    };
  };

  return {
    clearError: (fieldName: string) => {
      if (!state.errors[fieldName]) {
        return;
      }
      state = {
        ...state,
        errors: {
          ...state.errors,
          [fieldName]: undefined,
        },
      };
      notifyFields([fieldName]);
    },
    getError: (fieldName: string) => state.errors[fieldName],
    getErrors: () => state.errors,
    getFieldSnapshot: (fieldName: string) => {
      const nextValue = state.values[fieldName];
      const nextError = state.errors[fieldName];
      const nextPrivacyLevel = state.privacyByField[fieldName];
      const cachedSnapshot = fieldSnapshotCache.get(fieldName);
      if (
        cachedSnapshot &&
        Object.is(cachedSnapshot.value, nextValue) &&
        cachedSnapshot.error === nextError &&
        cachedSnapshot.privacyLevel === nextPrivacyLevel
      ) {
        return cachedSnapshot;
      }
      const nextSnapshot: FormFieldSnapshotType = {
        value: nextValue,
        error: nextError,
        privacyLevel: nextPrivacyLevel,
      };
      fieldSnapshotCache.set(fieldName, nextSnapshot);
      return nextSnapshot;
    },
    getPrivacy: (fieldName: string) => state.privacyByField[fieldName],
    getValue: (fieldName: string) => state.values[fieldName],
    getValues: () => state.values,
    getValuesSubset: (fieldNames: string[]) =>
      fieldNames.reduce<Record<string, unknown>>((accumulator, fieldName) => {
        accumulator[fieldName] = state.values[fieldName];
        return accumulator;
      }, {}),
    setErrors: (errors: Record<string, string | undefined>) => {
      const changedFields = getChangedKeys(state.errors, errors);
      if (changedFields.length === 0) {
        return;
      }
      state = {
        ...state,
        errors,
      };
      notifyFields(changedFields);
    },
    setFieldValue: (fieldName, value) => {
      if (Object.is(state.values[fieldName], value)) {
        return;
      }
      state = {
        ...state,
        values: {
          ...state.values,
          [fieldName]: value,
        },
      };
      notifyFields([fieldName]);
    },
    setPrivacy: (fieldName, level) => {
      if (state.privacyByField[fieldName] === level) {
        return;
      }
      state = {
        ...state,
        privacyByField: {
          ...state.privacyByField,
          [fieldName]: level,
        },
      };
      notifyFields([fieldName]);
    },
    setValues: (nextValues) => {
      const resolvedValues =
        typeof nextValues === 'function'
          ? nextValues(state.values)
          : nextValues;
      const changedFields = getChangedKeys(state.values, resolvedValues);
      if (changedFields.length === 0) {
        return;
      }
      state = {
        ...state,
        values: resolvedValues,
      };
      notifyFields(changedFields);
    },
    subscribeAll: (listener: Listener) => {
      globalListeners.add(listener);
      return () => {
        globalListeners.delete(listener);
      };
    },
    subscribeField,
    subscribeFields: (fieldNames: string[], listener: Listener) => {
      const uniqueFieldNames = [...new Set(fieldNames)];
      const unsubscribers = uniqueFieldNames.map((fieldName) =>
        subscribeField(fieldName, listener)
      );
      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    },
  };
};

/**
 * Create a stable form store instance for the lifetime of a component.
 */
export const useFormStore = <T extends FormDataRecord>(
  initialValues: T | (() => T),
  options: FormStoreOptionsType = {}
): FormStoreType<T> => {
  const storeRef = useRef<FormStoreType<T> | null>(null);
  if (!storeRef.current) {
    const resolvedInitialValues =
      typeof initialValues === 'function'
        ? (initialValues as () => T)()
        : initialValues;
    storeRef.current = createFormStore(resolvedInitialValues, options);
  }
  return storeRef.current;
};

/**
 * Subscribe to one field snapshot from the shared form store.
 */
export const useFormFieldSnapshot = <T extends FormDataRecord>(
  store: FormStoreSubscriberType<T>,
  fieldName: string
): FormFieldSnapshotType => {
  const subscribe = useCallback(
    (listener: Listener) => store.subscribeField(fieldName, listener),
    [fieldName, store]
  );
  const getSnapshot = useCallback(
    () => store.getFieldSnapshot(fieldName),
    [fieldName, store]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Subscribe to one optional field snapshot. When no store is present, this hook
 * returns an empty snapshot and never subscribes.
 */
export const useOptionalFormFieldSnapshot = <T extends FormDataRecord>(
  store: FormStoreSubscriberType<T> | undefined,
  fieldName: string
): FormFieldSnapshotType => {
  const subscribe = useCallback(
    (listener: Listener) =>
      store && fieldName
        ? store.subscribeField(fieldName, listener)
        : () => undefined,
    [fieldName, store]
  );
  const getSnapshot = useCallback(
    () =>
      store && fieldName
        ? store.getFieldSnapshot(fieldName)
        : EMPTY_FIELD_SNAPSHOT,
    [fieldName, store]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Subscribe to a shallow set of form values from the shared store.
 */
export const useFormValuesSubset = <T extends FormDataRecord>(
  store: FormStoreType<T>,
  fieldNames: string[]
): Record<string, unknown> => {
  const fieldKey = fieldNames.join('|');
  const subscribe = useCallback(
    (listener: Listener) => store.subscribeFields(fieldNames, listener),
    [fieldKey, fieldNames, store]
  );
  const getSnapshot = useCallback(() => {
    const nextValues = store.getValuesSubset(fieldNames);
    return nextValues;
  }, [fieldKey, fieldNames, store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Check whether a subscribed subset changed across snapshots.
 */
export const hasSubsetChanged = (
  previousSubset: Record<string, unknown>,
  nextSubset: Record<string, unknown>,
  fieldNames: string[]
): boolean => didKeysChange(previousSubset, nextSubset, fieldNames);
