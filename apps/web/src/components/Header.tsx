import Link from 'next/link';

import { MobileNavToggle, type NavLink } from '@/components/MobileNavToggle';
import { site } from '@/config/site';
import { paths } from '@/lib/paths';

const NAV: NavLink[] = [
  { href: paths.cafes, label: 'Cafes' },
  { href: paths.events, label: 'Events' },
  { href: paths.forCafes, label: 'For cafes' },
];

const DOWNLOAD: NavLink = { href: paths.download, label: 'Get the app' };

export function Header() {
  return (
    <header className="border-border bg-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-x relative flex h-16 items-center justify-between gap-4">
        <Link href={paths.home} className="font-display text-lg font-bold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted hover:text-text text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
          <Link href={DOWNLOAD.href} className="btn btn-primary">
            {DOWNLOAD.label}
          </Link>
        </nav>
        <MobileNavToggle links={[...NAV, DOWNLOAD]} />
      </div>
    </header>
  );
}
