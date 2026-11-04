import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/config/site';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: `For gaming cafes in ${site.city.name}`,
  description: `List your gaming cafe on ${site.name}: your tiers, prices, games and hours on the web and in the app, and squad bookings without phone calls. No listing fee while we launch in ${site.city.name}.`,
  path: paths.forCafes,
});

const BENEFITS = [
  {
    title: 'A page players actually find',
    text: 'Your tiers, prices per hour, games, hours and photos on a page built for search, plus a card in the app.',
  },
  {
    title: 'Squad bookings, not phone calls',
    text: 'Players hold several stations of one tier for one time range and confirm. You see the booking straight away and the seats are blocked for everyone else.',
  },
  {
    title: 'Your events, promoted',
    text: 'Launch nights, tournaments and late-night rates go on the events page and in the app. GTA VI night is a good first one.',
  },
  {
    title: 'Counter tool later',
    text: 'A counter view for walk-ins and your bookings comes after launch. Tell us what it needs to do.',
  },
] as const;

const STEPS = [
  'Message us with your cafe name and area. We visit, or you send photos, tiers, prices and hours.',
  'We set your page up and send you the link to check. You go live when you say so.',
  'Bookings arrive from the app. We stay in touch on WhatsApp while we learn what works.',
] as const;

function whatsappUrl(number: string): string {
  return `https://wa.me/${number.replace(/[^\d]/g, '')}`;
}

export default function ForCafesPage() {
  const hasContact = site.whatsapp !== null || site.email !== null;

  return (
    <div className="container-x py-12 sm:py-16">
      <p className="eyebrow mb-3">For cafes</p>
      <h1 className="font-display max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        Run a gaming cafe in {site.city.name}? Get listed.
      </h1>
      <p className="text-muted mt-4 max-w-2xl text-lg">
        {site.name} shows players what you have and lets their whole squad book seats at once. No
        listing fee while we launch in {site.city.name}. Anything beyond that, talk to us.
      </p>

      <section aria-labelledby="benefits-heading" className="mt-12">
        <h2 id="benefits-heading" className="font-display text-2xl font-semibold">
          What you get
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="card p-5">
              <h3 className="font-display text-lg font-semibold">{benefit.title}</h3>
              <p className="text-muted mt-2 text-sm">{benefit.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-heading" className="mt-12">
        <h2 id="steps-heading" className="font-display text-2xl font-semibold">
          How it works for you
        </h2>
        <ol className="mt-6 flex flex-col gap-3">
          {STEPS.map((step, index) => (
            <li key={step} className="card flex gap-4 p-5">
              <span className="font-display text-accent font-semibold" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="text-sm">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="contact-heading"
        className="card bg-surface-2 mt-12 flex flex-col gap-4 p-6 sm:p-10"
      >
        <h2 id="contact-heading" className="font-display text-2xl font-semibold">
          Talk to us
        </h2>
        {hasContact ? (
          <>
            <p className="text-muted max-w-xl">
              We are signing cafes in person across {site.city.name}. Say hello and we will come by.
            </p>
            <div className="flex flex-wrap gap-3">
              {site.whatsapp ? (
                <a
                  href={whatsappUrl(site.whatsapp)}
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                >
                  WhatsApp us
                </a>
              ) : null}
              {site.email ? (
                <a href={`mailto:${site.email}`} className="btn btn-secondary btn-lg">
                  Email {site.email}
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-muted max-w-xl">
            Contact details are being set up. In the meantime,{' '}
            <Link href={paths.cafes} className="link-accent">
              see how cafe pages look
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
