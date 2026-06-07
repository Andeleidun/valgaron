/**
 * Replace `{{token}}` placeholders in a localized dashboard template.
 */
export const formatDashboardTemplate = (
  template: string,
  replacements: Record<string, number | string>
): string =>
  Object.entries(replacements).reduce(
    (currentValue, [key, replacement]) =>
      currentValue.replaceAll(`{{${key}}}`, String(replacement)),
    template
  );
