export function formatRouteRedirectDestination({
  destination,
  hash,
  search,
}: {
  destination: string;
  hash: string;
  search: string;
}): string {
  return `${destination}${search}${hash}`;
}
