import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        We could not find that page
      </h1>
      <p className="text-muted mt-3">The link may have a typo, or the page has moved.</p>
      <Link href="/sign-in" className="btn btn-primary mt-8">
        Go to sign-in
      </Link>
    </div>
  );
}
