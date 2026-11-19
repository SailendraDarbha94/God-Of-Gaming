'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundaries must be client components. This one also catches a shell that failed to load,
 * for example because src/lib/env.ts refused the environment; the reason is in the console.
 */
export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto w-full max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted mt-3">The page could not be shown. Trying again usually fixes it.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
