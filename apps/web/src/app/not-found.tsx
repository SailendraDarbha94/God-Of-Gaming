import type { Metadata } from 'next';
import Link from 'next/link';

import { paths } from '@/lib/paths';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        We could not find that page
      </h1>
      <p className="text-muted mx-auto mt-3 max-w-md">
        The cafe or event may have been removed, or the link has a typo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={paths.cafes} className="btn btn-primary">
          All cafes
        </Link>
        <Link href={paths.home} className="btn btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
