import { site } from '@/config/site';
import { paths } from '@/lib/paths';

export type Platform = 'ios' | 'android' | 'other';
export type StorePlatform = Exclude<Platform, 'other'>;

export interface StoreLink {
  platform: StorePlatform;
  /** Store name, the large line of the button. */
  store: string;
  /** The small line above the store name ("Download on the"). */
  prefix: string;
  /** `null` until the app is listed; buttons then read "Coming soon". */
  url: string | null;
}

export interface StoreUrls {
  appStoreUrl: string | null;
  playStoreUrl: string | null;
}

/**
 * Coarse platform detection from a user-agent string: enough to order store buttons and decide
 * whether a deep link is worth trying. iPadOS 13+ reports itself as a Mac and lands in `other`,
 * which is the safe outcome (store buttons instead of a deep link that may not resolve).
 */
export function detectPlatform(userAgent: string | null | undefined): Platform {
  if (!userAgent) {
    return 'other';
  }
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return 'ios';
  }
  return 'other';
}

export function isMobilePlatform(platform: Platform): platform is StorePlatform {
  return platform === 'ios' || platform === 'android';
}

const APP_STORE: Omit<StoreLink, 'url'> = {
  platform: 'ios',
  store: 'App Store',
  prefix: 'Download on the',
};
const GOOGLE_PLAY: Omit<StoreLink, 'url'> = {
  platform: 'android',
  store: 'Google Play',
  prefix: 'Get it on',
};

/** Both store links, the detected platform's first. */
export function storeLinks(urls: StoreUrls, platform: Platform = 'other'): StoreLink[] {
  const links: StoreLink[] = [
    { ...APP_STORE, url: urls.appStoreUrl },
    { ...GOOGLE_PLAY, url: urls.playStoreUrl },
  ];
  if (platform === 'android') {
    links.reverse();
  }
  return links;
}

/** The store URL for a platform, or `null` when there is no store for it or no listing yet. */
export function storeUrlFor(platform: Platform, links: StoreLink[]): string | null {
  return links.find((link) => link.platform === platform)?.url ?? null;
}

/** Scheme fallback for a cafe, used when the Universal Link cannot open the app. */
export function cafeDeepLink(slug: string): string {
  return `${site.appScheme}://cafe/${slug}`;
}

export type BookCta =
  /** A desktop browser: the app cannot open here, show the badges. */
  | { kind: 'desktop' }
  /** No store listing to fall back to (or the platform is not known yet): badges plus an opt-in deep link. */
  | { kind: 'stores-only' }
  /** A phone whose store lists the app: try the app, then send to the store. */
  | { kind: 'open-app'; storeUrl: string };

/**
 * What the "Book in the app" card should offer. `platform` is `null` during server rendering and
 * hydration, which must never produce a bare `gog://` link: a visitor without the app would see
 * the browser's "address is invalid" page.
 */
export function bookCta(platform: Platform | null, stores: StoreLink[]): BookCta {
  if (platform === null) {
    return { kind: 'stores-only' };
  }
  if (!isMobilePlatform(platform)) {
    return { kind: 'desktop' };
  }
  const storeUrl = storeUrlFor(platform, stores);
  return storeUrl === null ? { kind: 'stores-only' } : { kind: 'open-app', storeUrl };
}

export type CtaTarget = { kind: 'internal'; href: string } | { kind: 'external'; href: string };

/**
 * Where a promotion's call to action should send a visitor. A cafe deep link (`gog://cafe/<slug>`)
 * becomes the cafe page, which carries the "Book in the app" button and works on every device.
 */
export function ctaTarget(url: string): CtaTarget {
  const cafeMatch = new RegExp(`^${site.appScheme}://cafe/([a-z0-9-]+)/?$`).exec(url);
  if (cafeMatch?.[1]) {
    return { kind: 'internal', href: paths.cafe(cafeMatch[1]) };
  }
  if (url.startsWith('/')) {
    return { kind: 'internal', href: url };
  }
  return { kind: 'external', href: url };
}
