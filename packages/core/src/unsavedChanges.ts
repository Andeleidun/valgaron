function normalizeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(normalizeValue).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
      .map(
        ([key, nestedValue]) =>
          `${JSON.stringify(key)}:${normalizeValue(nestedValue)}`
      )
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hasUnsavedChanges<TValue>(
  initialValue: TValue,
  currentValue: TValue
): boolean {
  return normalizeValue(initialValue) !== normalizeValue(currentValue);
}
