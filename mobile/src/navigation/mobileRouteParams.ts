export type MobileRouteParamValue = string | string[] | undefined;

export function getMobileRouteParam(
  value: MobileRouteParamValue
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getNextMobileEntryQuery({
  currentQuery,
  requestedQuery,
  sectionChanged,
}: {
  currentQuery: string;
  requestedQuery?: string;
  sectionChanged: boolean;
}): string {
  if (requestedQuery !== undefined) {
    return requestedQuery;
  }
  return sectionChanged ? '' : currentQuery;
}
