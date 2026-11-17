import type { Metadata } from 'next';

import { SignInScreen } from '@/features/auth/SignInScreen';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return <SignInScreen />;
}
