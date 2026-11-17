import type { ReactNode } from 'react';

import { ClientShell } from '@/components/ClientShell';

/**
 * Every route in this group renders inside the client-only shell, so the server sends a static
 * frame and all data access happens in the browser (ADR 0013).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
