'use client';

import type { MouseEvent } from 'react';
import { useSyncExternalStore } from 'react';

import { StoreButtons } from '@/components/StoreButtons';
import { bookCta, detectPlatform, type Platform, type StoreLink } from '@/lib/store-links';

interface Props {
  cafeName: string;
  /** `gog://cafe/<slug>`: the scheme fallback for the Universal Link, which is this very page. */
  deepLink: string;
  stores: StoreLink[];
}

/** How long the app gets to take over before we assume it is not installed. */
const OPEN_APP_TIMEOUT_MS = 1500;

// The user agent never changes while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {
  /* nothing to clean up */
};
const serverPlatform = (): Platform | null => null;
const clientPlatform = (): Platform => detectPlatform(navigator.userAgent);

/** `null` during server rendering and hydration, the real platform right after. */
function usePlatform(): Platform | null {
  return useSyncExternalStore(subscribe, clientPlatform, serverPlatform);
}

/**
 * The one call to action that needs the browser (05-web.md, Routes). On a phone whose store lists
 * the app it opens the app and falls back to the store; while there is no listing (and during server
 * rendering, so a visitor without JavaScript never gets a bare `gog://` link) it shows the badges
 * with an opt-in link for people who already have the app; on a desktop it shows the badges.
 */
export function BookInAppButton({ cafeName, deepLink, stores }: Props) {
  const platform = usePlatform();
  const cta = bookCta(platform, stores);

  switch (cta.kind) {
    case 'desktop':
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Booking happens in the app. Open this page on your phone, or get the app:
          </p>
          <StoreButtons stores={stores} />
        </div>
      );
    case 'stores-only':
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm">The app is not in the stores yet. Check back soon.</p>
          <StoreButtons stores={stores} />
          <a href={deepLink} className="link-accent text-sm">
            Already have the app? Open it
          </a>
        </div>
      );
    case 'open-app': {
      const openApp = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.location.href = deepLink;
        window.setTimeout(() => {
          if (document.visibilityState === 'visible') {
            window.location.assign(cta.storeUrl);
          }
        }, OPEN_APP_TIMEOUT_MS);
      };
      return (
        <div className="flex flex-col gap-3">
          <a href={deepLink} onClick={openApp} className="btn btn-primary btn-lg w-full sm:w-auto">
            Book {cafeName} in the app
          </a>
          <p className="text-muted text-sm">
            Opens the app if you have it, otherwise takes you to the store.
          </p>
        </div>
      );
    }
  }
}
