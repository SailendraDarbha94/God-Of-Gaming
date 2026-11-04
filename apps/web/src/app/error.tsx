'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Error boundaries must be client components; this one only logs and offers a retry. */
export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="text-muted mx-auto mt-3 max-w-md">
        The page could not be shown. Trying again usually fixes it.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
