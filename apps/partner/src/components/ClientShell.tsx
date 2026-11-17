'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { ShellLoading } from './ShellLoading';

/**
 * The ssr: false boundary (docs/spec/09-partner-app.md, Rules every screen follows). The shell and
 * everything it imports (the environment now; the repositories and providers from M1) load in the
 * browser only, so no module that creates a client, a repository or a fixture world is evaluated
 * during server rendering. Next 16 allows `ssr: false` only inside a client component
 * (node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
 */
const AppShell = dynamic(() => import('./AppShell').then((module) => module.AppShell), {
  ssr: false,
  loading: () => <ShellLoading />,
});

export function ClientShell({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
