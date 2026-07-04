import {
  codexShellRoutes,
  formatCodexRouteSearch,
  type CodexShellRouteId,
} from './shell';

export type CodexRouteIntent = {
  routeId: CodexShellRouteId;
  pathname: string;
  params: Record<string, string>;
  focusId?: string;
};

const codexShellRouteEntries = Object.entries(codexShellRoutes) as Array<
  [CodexShellRouteId, { path: string }]
>;

function getRouteIdForPathname(pathname: string): CodexShellRouteId {
  const matchedRoute = codexShellRouteEntries.find(
    ([, route]) => route.path === pathname
  );
  if (!matchedRoute) {
    throw new Error(`Unsupported codex route path: ${pathname}`);
  }
  return matchedRoute[0];
}

function decodeRouteFocusId(
  rawFocusId: string | undefined
): string | undefined {
  return rawFocusId ? decodeURIComponent(rawFocusId) : undefined;
}

export function parseCodexRouteIntent(route: string): CodexRouteIntent {
  const hashStart = route.indexOf('#');
  const routeWithoutHash = hashStart >= 0 ? route.slice(0, hashStart) : route;
  const focusId = decodeRouteFocusId(
    hashStart >= 0 ? route.slice(hashStart + 1) : undefined
  );
  const queryStart = routeWithoutHash.indexOf('?');
  const pathname =
    (queryStart >= 0
      ? routeWithoutHash.slice(0, queryStart)
      : routeWithoutHash) || '/';
  const search = queryStart >= 0 ? routeWithoutHash.slice(queryStart + 1) : '';
  const params: Record<string, string> = {};
  new URLSearchParams(search).forEach((value, key) => {
    params[key] = value;
  });

  return {
    routeId: getRouteIdForPathname(pathname),
    pathname,
    params,
    ...(focusId ? { focusId } : {}),
  };
}

export function formatCodexRouteIntent(intent: CodexRouteIntent): string {
  const route = codexShellRoutes[intent.routeId];
  const focus = intent.focusId ? `#${encodeURIComponent(intent.focusId)}` : '';
  return `${route.path}${formatCodexRouteSearch(intent.params)}${focus}`;
}
