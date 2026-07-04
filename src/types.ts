export * from '@valgaron/core';

/** Simple option shape used by retained MUI-based reusable controls. */
export type OptionType = {
  value: string;
  label?: string;
};

/** User-facing English text accepted by reusable controls. */
export type StringOrOptionType = string | OptionType | null | undefined;
