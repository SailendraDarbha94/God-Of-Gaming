import { isBookable, type Cafe } from '@gog/domain';

import { BookInAppButton } from '@/components/BookInAppButton';
import { StoreButtons } from '@/components/StoreButtons';
import { cafeDeepLink, type StoreLink } from '@/lib/store-links';

/**
 * The cafe page's one call to action (ADR 0004: download conversion is the website's metric). The
 * page renders it twice, under the address for phones and in the sticky aside for wide screens, and
 * shows exactly one instance per breakpoint; this component decides what it says.
 */
export function BookCta({ cafe, stores }: { cafe: Cafe; stores: StoreLink[] }) {
  if (isBookable(cafe)) {
    return (
      <BookInAppButton cafeName={cafe.name} deepLink={cafeDeepLink(cafe.slug)} stores={stores} />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">This cafe is not taking bookings through the app right now.</p>
      <p className="text-muted text-sm">Get the app to be ready when they resume.</p>
      <StoreButtons stores={stores} />
    </div>
  );
}
