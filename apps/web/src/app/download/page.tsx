import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { StoreButtons } from '@/components/StoreButtons';
import { site } from '@/config/site';
import { env } from '@/lib/env';
import { bookingLimits } from '@/lib/format';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';
import { detectPlatform, storeLinks } from '@/lib/store-links';

export const metadata: Metadata = pageMetadata({
  title: `Download the ${site.name} app`,
  description: `Get the ${site.name} app for iPhone and Android: find gaming cafes in ${site.city.name}, hold seats for your squad and confirm.`,
  path: paths.download,
});

// The numbers come from the booking rules, and the sign-in line must agree with /privacy (which
// lists the phone number, an optional display name and the bookings themselves).
const FEATURES = [
  `Every listed cafe in ${site.city.name}, with tiers, prices per hour, games and hours`,
  'Live availability per tier, so you see how many seats are free before you book',
  `Hold up to ${bookingLimits.maxSeats} seats of one tier for ${bookingLimits.holdMinutes} minutes while your squad decides`,
  'Sign in with your phone number. No password, no email.',
] as const;

/** Reading the user-agent makes this page dynamic, so the detected platform's store comes first. */
export default async function DownloadPage() {
  const userAgent = (await headers()).get('user-agent');
  const platform = detectPlatform(userAgent);
  const stores = storeLinks(
    { appStoreUrl: env.appStoreUrl, playStoreUrl: env.playStoreUrl },
    platform,
  );

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div>
          <p className="eyebrow mb-3">The app</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Get the {site.name} app
          </h1>
          <p className="text-muted mt-4 max-w-xl text-lg">
            Find a cafe in {site.city.name}, hold seats for your squad and confirm, all from your
            phone. Free to download.
          </p>
          <div className="mt-8">
            <StoreButtons stores={stores} />
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="What the app does">
            {FEATURES.map((feature) => (
              <li key={feature} className="card flex gap-3 p-4 text-sm">
                <span aria-hidden="true" className="text-accent font-bold">
                  ·
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <div
            role="img"
            aria-label="QR code placeholder"
            className="border-border grid size-40 place-items-center rounded-md border-2 border-dashed"
          >
            <span className="text-muted text-sm">QR code coming soon</span>
          </div>
          <p className="text-muted text-sm">
            Scan from your phone to open the store listing once the app is live.
          </p>
        </div>
      </div>
    </div>
  );
}
