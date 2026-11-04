import type { Metadata } from 'next';
import Link from 'next/link';

import { DraftNotice } from '@/components/DraftNotice';
import { site } from '@/config/site';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: `About ${site.name}`,
  description: `${site.name} is a booking aggregator for gaming cafes in India, starting in ${site.city.name}. Find a cafe, hold seats for your squad, confirm in the app.`,
  path: paths.about,
});

export default function AboutPage() {
  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <p className="eyebrow mb-3">About</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        About {site.name}
      </h1>
      <div className="mt-8">
        <DraftNotice />
      </div>
      <div className="flex flex-col gap-5 leading-7">
        <p>
          {site.name} is a booking aggregator for gaming cafes in India, starting in{' '}
          {site.city.name}. The website shows what each cafe has: PC tiers, consoles, VR and sim
          rigs, prices per hour, games and opening hours. The app is where you hold seats for your
          squad and confirm.
        </p>
        <p>
          Gaming is a group activity, and cafes price by tier per hour, so booking one seat at a
          time never fit. We built the booking flow around the squad: pick a tier, a time and how
          many of you are coming, and the app holds that many stations together.
        </p>
        <p>
          We are a small team based in {site.city.name} and we sign every cafe in person. Cafes
          shown during development are sample data, not real venues.
        </p>
        <p>
          Run a cafe?{' '}
          <Link href={paths.forCafes} className="link-accent">
            Here is how listing works
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
