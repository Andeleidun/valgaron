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
  'entries' | 'timeline' | 'relationships' | 'utilities'
>;

export type MobileTabIconName =
  | 'book-open'
  | 'clock'
  | 'git-branch'
  | 'more-horizontal';

const mobileTabIconNames: Record<MobileTabId, MobileTabIconName> = {
  entries: 'book-open',
  timeline: 'clock',
  relationships: 'git-branch',
  utilities: 'more-horizontal',
};

export const mobileRouteFocusParam = 'routeFocusId' as const;

export type MobileTabRoute = {
  id: MobileTabId;
  title: string;
  tabLabel: string;
  tabAccessibilityLabel: string;
  href: string;
  iconName: MobileTabIconName;
  screenName: 'entries' | 'timeline' | 'relationships' | 'more';
};

function getMobileTabScreenName(id: MobileTabId): MobileTabRoute['screenName'] {
  switch (id) {
    case 'entries':
      return 'entries';
    case 'timeline':
      return 'timeline';
    case 'relationships':
      return 'relationships';
    case 'utilities':
      return 'more';
  }
}

export const mobileTabRoutes: readonly MobileTabRoute[] = getCodexShellRoutes(
  mobilePrimaryRouteOrder
).map((route) => {
  const id = route.id as MobileTabId;
  const tabLabel = getCodexMobileShellRouteLabel(id);
  return {
    id,
    title: route.title,
    tabLabel,
    tabAccessibilityLabel: `${tabLabel} tab`,
    href: id === 'utilities' ? '/more' : route.path,
    iconName: mobileTabIconNames[id],
    screenName: getMobileTabScreenName(id),
  };
});

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
  const pathnameByRouteId: Partial<Record<CodexShellRouteId, string>> = {
    data: '/data',
    help: '/help',
    knowledge: '/more',
    utilities: '/more',
    workspaces: '/workspaces',
  };
  return {
    pathname: pathnameByRouteId[intent.routeId] ?? intent.pathname,
    params: {
      ...intent.params,
      ...(intent.focusId ? { [mobileRouteFocusParam]: intent.focusId } : {}),
    },
  };
}
