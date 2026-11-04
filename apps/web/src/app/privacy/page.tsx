import type { Metadata } from 'next';

import { DraftNotice } from '@/components/DraftNotice';
import { site } from '@/config/site';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy',
  description: `What ${site.name} collects on the website and in the apps, and why. Draft.`,
  path: paths.privacy,
});

export default function PrivacyPage() {
  return (
    <div className="container-x max-w-3xl py-12 sm:py-16">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Privacy</h1>
      <div className="mt-8">
        <DraftNotice />
      </div>
      <div className="flex flex-col gap-8 leading-7">
        <section aria-labelledby="website-heading" className="flex flex-col gap-3">
          <h2 id="website-heading" className="font-display text-xl font-semibold">
            This website
          </h2>
          <p>
            The website has no accounts, no forms and no analytics. It sets no cookies. It reads
            public cafe and event listings and nothing about you.
          </p>
        </section>
        <section aria-labelledby="apps-heading" className="flex flex-col gap-3">
          <h2 id="apps-heading" className="font-display text-xl font-semibold">
            The apps
          </h2>
          <p>The {site.name} app collects:</p>
          <ul className="list-disc pl-6">
            <li>Your phone number, to sign you in with a one-time code.</li>
            <li>A display name, if you choose to set one.</li>
            <li>
              The bookings you make: cafe, station tier, time, number of seats and status, shared
              with that cafe so it can seat you.
            </li>
          </ul>
          <p>
            Nothing else is collected, and nothing is sold or shared for advertising. Before launch
            this page will set out retention periods, how to delete your account and the consent
            wording required under India&apos;s Digital Personal Data Protection rules.
          </p>
        </section>
        <section aria-labelledby="contact-heading" className="flex flex-col gap-3">
          <h2 id="contact-heading" className="font-display text-xl font-semibold">
            Questions
          </h2>
          <p>
            {site.email
              ? `Write to ${site.email}.`
              : 'A contact address will be published here before launch.'}
          </p>
        </section>
      </div>
    </div>
  );
}
