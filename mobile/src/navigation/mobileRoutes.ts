import {
  getCodexShellRouteTitle,
  getCodexShellRoutes,
  getCodexMobileShellRouteLabel,
  mobilePrimaryRouteOrder,
  parseCodexRouteIntent,
  type CodexShellRouteId,
} from '@valgaron/core';

export type MobileTabId = Extract<
  CodexShellRouteId,
  'overview' | 'entries' | 'relationships' | 'workspaces' | 'data' | 'help'
>;

export type MobileTabIconName =
  | 'book-open'
  | 'database'
  | 'git-branch'
  | 'help-circle'
  | 'home'
  | 'layers';

const mobileTabIconNames: Record<MobileTabId, MobileTabIconName> = {
  overview: 'home',
  entries: 'book-open',
  relationships: 'git-branch',
  workspaces: 'layers',
  data: 'database',
  help: 'help-circle',
};

export const mobileRouteFocusParam = 'routeFocusId' as const;

export type MobileTabRoute = {
  id: MobileTabId;
  title: string;
  tabLabel: string;
  href: string;
  iconName: MobileTabIconName;
  screenName: 'index' | Exclude<MobileTabId, 'overview'>;
};

export const mobileTabRoutes: readonly MobileTabRoute[] = getCodexShellRoutes(
  mobilePrimaryRouteOrder
).map((route) => ({
  id: route.id as MobileTabId,
  title: route.title,
  tabLabel: getCodexMobileShellRouteLabel(route.id),
  href: route.path === '/entries' ? '/entries' : route.path,
  iconName: mobileTabIconNames[route.id as MobileTabId],
  screenName:
    route.id === 'overview'
      ? 'index'
      : (route.id as Exclude<MobileTabId, 'overview'>),
}));

export function getMobileTabTitle(id: MobileTabId): string {
  return getCodexShellRouteTitle(id);
}

export function getMobileTabHref(id: MobileTabId): string {
  return mobileTabRoutes.find((route) => route.id === id)?.href ?? '/';
}

export function getMobileRouteHref(route: string): {
  pathname: string;
  params: Record<string, string>;
} {
  const intent = parseCodexRouteIntent(route);
  return {
    pathname: intent.pathname,
    params: {
      ...intent.params,
      ...(intent.focusId ? { [mobileRouteFocusParam]: intent.focusId } : {}),
    },
  };
}
