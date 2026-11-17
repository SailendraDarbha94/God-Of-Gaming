'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ShellLoading } from '@/components/ShellLoading';

/**
 * `/` decides where to go in the browser, because the session lives there. With no sign-in yet,
 * everyone goes to /sign-in; M1 sends a signed-in member with one cafe to its board and everyone
 * else signed in to /cafes (docs/spec/09-partner-app.md, Routes).
 */
export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);
  return <ShellLoading />;
}
