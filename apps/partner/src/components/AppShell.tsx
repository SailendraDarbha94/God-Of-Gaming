'use client';

import type { ReactNode } from 'react';

import { site } from '@/config/site';
import { env } from '@/lib/env';

/**
 * The frame of every (app) route, loaded in the browser only through ClientShell. Importing the
 * environment here parses it as the shell loads, so a wrong environment stops the app before any
 * screen renders and the root error boundary shows it. M1 adds the providers (QueryProvider,
 * SessionProvider, CafeProvider) and the signed-in header with the cafe switcher and Sign out.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      {env.data.source === 'fixtures' ? (
        <p role="note" className="bg-surface-2 text-muted px-4 py-2 text-center text-xs">
          Sample data: nothing here is real, and each browser tab has its own copy.
        </p>
      ) : null}
      <header className="border-border border-b">
        <div className="mx-auto flex w-full max-w-6xl items-baseline gap-2 px-4 py-3">
          <span className="font-display text-base font-bold">{site.name}</span>
          <span className="text-muted text-sm">for cafes</span>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
