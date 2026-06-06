/**
 * Core route configuration for MVP.
 * Core routes are fully accessible; non-core routes show disabled state.
 */
export const CORE_ROUTES = [
  '/',
  '/send',
  '/claim',
  '/tipjar',
  '/collective',
  '/dashboard',
  '/api-keys',
  '/docs',
  '/privacy-policy',
  '/terms-of-service',
  '/data-deletion',
] as const;

export type CoreRoute = typeof CORE_ROUTES[number];

export const DISABLED_ROUTE_CATEGORIES = {
  personal: [
    '/pay',
    '/request',
    '/contacts',
  ],
  organization: [
    '/batch',
    '/streaming',
    '/analytics',
    '/escrow',
    '/calendar',
    '/badges',
    '/recurring',
    '/organizations',
  ],
  developer: [
    '/developers',
    '/webhooks',
    '/cross-chain',
    '/networks',
  ],
  other: [
    '/assets',
    '/bundle',
    '/explorer',
    '/labels',
    '/cashback',
    '/approvals',
    '/disputes',
    '/subscriptions',
    '/affiliate',
    '/games',
    '/contract',
    '/giftcards',
    '/feed',
    '/timelock',
    '/nfc',
    '/account-recovery',
    '/whitelabel',
    '/tax-report',
    '/invoice',
    '/donation',
    '/split-bill',
    '/statement',
    '/history',
    '/bills',
    '/withdraw',
    '/deposit',
    '/buy',
    '/qr',
    '/privacy',
    '/referral',
    '/budget',
    '/templates',
    '/merchant',
    '/verification',
    '/loyalty',
    '/limits',
    '/qr-service',
    '/roundup',
    '/auto-receive',
    '/clipboard',
    '/biometric',
    '/scheduled',
    '/bulk-send',
    '/import-export',
    '/qr-scanner',
    '/network-gas',
    '/security',
    '/help-faq',
    '/wallet-address',
    '/waiting-room',
    '/keyboard-shortcuts',
    '/accessibility',
    '/sessions',
    '/language',
    '/websocket',
    '/cache',
    '/rate-limit',
    '/gesture-controls',
    '/undo',
    '/voice-input',
    '/notifications',
    '/pending',
    '/address-book',
    '/profile',
    '/register',
    '/whatsapp',
    '/whatsapp-register',
  ],
} as const;

export const ALL_DISABLED_ROUTES = [
  ...DISABLED_ROUTE_CATEGORIES.personal,
  ...DISABLED_ROUTE_CATEGORIES.organization,
  ...DISABLED_ROUTE_CATEGORIES.developer,
  ...DISABLED_ROUTE_CATEGORIES.other,
] as const;

export function isCoreRoute(pathname: string): boolean {
  const basePath = pathname.split('?')[0].split('#')[0];
  return CORE_ROUTES.some(core => 
    basePath === core || 
    (core.endsWith('/') && basePath.startsWith(core)) ||
    basePath.startsWith(core + '/')
  );
}

export function isDisabledRoute(pathname: string): boolean {
  const basePath = pathname.split('?')[0].split('#')[0];
  return ALL_DISABLED_ROUTES.some(disabled => 
    basePath === disabled || 
    basePath.startsWith(disabled + '/')
  );
}

export function getDisabledRouteInfo(pathname: string): { category: string; route: string } | null {
  const basePath = pathname.split('?')[0].split('#')[0];
  
  for (const [category, routes] of Object.entries(DISABLED_ROUTE_CATEGORIES)) {
    for (const route of routes) {
      if (basePath === route || basePath.startsWith(route + '/')) {
        return { category, route };
      }
    }
  }
  return null;
}