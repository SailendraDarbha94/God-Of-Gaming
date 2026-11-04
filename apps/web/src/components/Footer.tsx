import Link from 'next/link';

import { site } from '@/config/site';
import { paths } from '@/lib/paths';

const EXPLORE = [
  { href: paths.cafes, label: 'Cafes' },
  { href: paths.events, label: 'Events' },
  { href: paths.download, label: 'Download the app' },
  { href: paths.forCafes, label: 'For cafes' },
] as const;

const COMPANY = [
  { href: paths.about, label: 'About' },
  { href: paths.privacy, label: 'Privacy' },
  { href: paths.terms, label: 'Terms' },
] as const;

export function Footer() {
  return (
    <footer className="border-border mt-16 border-t">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-lg font-bold tracking-tight">{site.name}</p>
          <p className="text-muted mt-2 max-w-sm text-sm">{site.tagline}</p>
          {site.social.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-4" aria-label="Social links">
              {site.social.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    rel="noopener noreferrer"
                    className="text-muted hover:text-text text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <nav aria-label="Explore">
          <p className="eyebrow mb-3">Explore</p>
          <ul className="flex flex-col gap-2">
            {EXPLORE.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted hover:text-text text-sm">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="eyebrow mb-3">Company</p>
          <ul className="flex flex-col gap-2">
            {COMPANY.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted hover:text-text text-sm">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-border border-t">
        <p className="container-x text-muted py-4 text-xs">
          {site.name} · {site.city.name}. Cafes shown during development are sample data, not real
          venues.
        </p>
      </div>
    </footer>
  );
}
