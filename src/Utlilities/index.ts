import type { StringOrOptionType } from '../types';

/** Replace named placeholders in a user-facing English template. */
export function formatTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (currentTemplate, [key, value]) =>
      currentTemplate.replaceAll(`{${key}}`, String(value)),
    template
  );
}

/** Render a simple English string or option label for reusable inputs. */
export function renderTextValue(value: StringOrOptionType): string {
  if (typeof value === 'string') {
    return value;
  }
  if (!value) {
    return '';
  }
  return value.label ?? value.value;
}
