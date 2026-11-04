import type { Metadata } from 'next';

import { DraftNotice } from '@/components/DraftNotice';
import { site } from '@/config/site';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms',
  description: `Terms of use for the ${site.name} website and apps. Draft.`,
  path: paths.terms,
});

export default function TermsPage() {
  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Terms</h1>
      <div className="mt-8">
        <DraftNotice />
      </div>
      <div className="flex flex-col gap-5 leading-7">
        <p>
          These terms will cover the use of the {site.name} website and apps. Until the final text
          is published, the points below describe how the service is meant to work.
        </p>
        <ul className="list-disc pl-6">
          <li>
            The website is a listing of gaming cafes and their events. Prices and hours are supplied
            by each cafe and may change; the cafe&apos;s counter is the final word.
          </li>
          <li>
            Bookings are made in the app and are agreements between you and the cafe. A held seat
            lapses if it is not confirmed within the hold window shown in the app.
          </li>
          <li>
            Cancellation and no-show rules, and any booking fee, will be stated in the app before
            you confirm and set out here before launch.
          </li>
          <li>{site.name} is a working title and may change.</li>
        </ul>
      </div>
    </div>
  );
}
