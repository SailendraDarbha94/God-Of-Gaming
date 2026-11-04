import Link from 'next/link';

import { StoreButtons } from '@/components/StoreButtons';
import { site } from '@/config/site';
import { env } from '@/lib/env';
import { paths } from '@/lib/paths';
import { storeLinks } from '@/lib/store-links';

/** The download band at the end of content pages. Platform order is neutral: these pages are cached. */
export function DownloadCta() {
  const stores = storeLinks({ appStoreUrl: env.appStoreUrl, playStoreUrl: env.playStoreUrl });
  return (
    <section aria-labelledby="download-cta-heading" className="container-x py-12 sm:py-16">
      <div className="card bg-surface-2 flex flex-col gap-6 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow mb-2">The app</p>
          <h2
            id="download-cta-heading"
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Hold seats for your squad from your phone
          </h2>
          <p className="text-muted mt-2">
            Booking happens in the {site.name} app: pick a cafe, a tier and a time, hold the seats
            and confirm.{' '}
            <Link href={paths.download} className="link-accent">
              More about the app
            </Link>
          </p>
        </div>
        <StoreButtons stores={stores} />
      </div>
    </section>
  );
}
