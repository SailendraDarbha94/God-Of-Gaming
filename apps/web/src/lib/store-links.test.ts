import { describe, expect, it } from 'vitest';

import {
  bookCta,
  cafeDeepLink,
  ctaTarget,
  detectPlatform,
  isMobilePlatform,
  storeLinks,
  storeUrlFor,
} from '@/lib/store-links';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const WINDOWS_EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

const URLS = {
  appStoreUrl: 'https://apps.apple.com/in/app/id123456789',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=in.example.player',
};

describe('detectPlatform', () => {
  it('recognises iPhone and iPad', () => {
    expect(detectPlatform(IPHONE)).toBe('ios');
    expect(detectPlatform(IPAD)).toBe('ios');
  });

  it('recognises Android', () => {
    expect(detectPlatform(ANDROID)).toBe('android');
  });

  it('treats desktops and missing user agents as other', () => {
    expect(detectPlatform(MAC_CHROME)).toBe('other');
    expect(detectPlatform(WINDOWS_EDGE)).toBe('other');
    expect(detectPlatform(null)).toBe('other');
    expect(detectPlatform(undefined)).toBe('other');
    expect(detectPlatform('')).toBe('other');
  });
});

describe('isMobilePlatform', () => {
  it('is true for the two store platforms only', () => {
    expect(isMobilePlatform('ios')).toBe(true);
    expect(isMobilePlatform('android')).toBe(true);
    expect(isMobilePlatform('other')).toBe(false);
  });
});

describe('storeLinks', () => {
  it('lists the App Store first by default', () => {
    expect(storeLinks(URLS).map((link) => link.platform)).toEqual(['ios', 'android']);
    expect(storeLinks(URLS, 'ios').map((link) => link.platform)).toEqual(['ios', 'android']);
    expect(storeLinks(URLS, 'other').map((link) => link.platform)).toEqual(['ios', 'android']);
  });

  it('puts Google Play first on Android', () => {
    expect(storeLinks(URLS, 'android').map((link) => link.platform)).toEqual(['android', 'ios']);
  });

  it('carries the URLs through and keeps unlisted stores null', () => {
    const [appStore, googlePlay] = storeLinks({
      appStoreUrl: URLS.appStoreUrl,
      playStoreUrl: null,
    });
    expect(appStore).toMatchObject({
      store: 'App Store',
      prefix: 'Download on the',
      url: URLS.appStoreUrl,
    });
    expect(googlePlay).toMatchObject({ store: 'Google Play', prefix: 'Get it on', url: null });
  });
});

describe('storeUrlFor', () => {
  const links = storeLinks({ appStoreUrl: URLS.appStoreUrl, playStoreUrl: null });

  it('returns the platform store URL when listed', () => {
    expect(storeUrlFor('ios', links)).toBe(URLS.appStoreUrl);
  });

  it('returns null for an unlisted store or a desktop', () => {
    expect(storeUrlFor('android', links)).toBeNull();
    expect(storeUrlFor('other', links)).toBeNull();
  });
});

describe('deep links', () => {
  it('builds the scheme fallback for a cafe', () => {
    expect(cafeDeepLink('pixel-den-koramangala')).toBe('gog://cafe/pixel-den-koramangala');
  });
});

describe('bookCta', () => {
  const listed = storeLinks(URLS);
  const unlisted = storeLinks({ appStoreUrl: null, playStoreUrl: null });
  const iosOnly = storeLinks({ appStoreUrl: URLS.appStoreUrl, playStoreUrl: null });

  it('shows the badges while the platform is unknown (server render, hydration)', () => {
    expect(bookCta(null, listed)).toEqual({ kind: 'stores-only' });
    expect(bookCta(null, unlisted)).toEqual({ kind: 'stores-only' });
  });

  it('shows the badges on a desktop', () => {
    expect(bookCta('other', listed)).toEqual({ kind: 'desktop' });
  });

  it('opens the app with a store fallback on a phone whose store lists it', () => {
    expect(bookCta('ios', listed)).toEqual({ kind: 'open-app', storeUrl: URLS.appStoreUrl });
    expect(bookCta('android', listed)).toEqual({ kind: 'open-app', storeUrl: URLS.playStoreUrl });
  });

  it('falls back to the badges on a phone with no listing yet', () => {
    expect(bookCta('ios', unlisted)).toEqual({ kind: 'stores-only' });
    expect(bookCta('android', iosOnly)).toEqual({ kind: 'stores-only' });
  });
});

describe('ctaTarget', () => {
  it('sends a cafe deep link to the cafe page', () => {
    expect(ctaTarget('gog://cafe/side-quest-jayanagar')).toEqual({
      kind: 'internal',
      href: '/cafes/side-quest-jayanagar',
    });
  });

  it('keeps site paths internal', () => {
    expect(ctaTarget('/cafes')).toEqual({ kind: 'internal', href: '/cafes' });
    expect(ctaTarget('/events/valorant-community-cup')).toEqual({
      kind: 'internal',
      href: '/events/valorant-community-cup',
    });
  });

  it('treats everything else as external', () => {
    expect(ctaTarget('https://discord.gg/example')).toEqual({
      kind: 'external',
      href: 'https://discord.gg/example',
    });
    expect(ctaTarget('gog://bookings')).toEqual({ kind: 'external', href: 'gog://bookings' });
  });
});
