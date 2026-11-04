import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { authErrorMessage } from '../../src/features/auth/copy';
import { OtpForm } from '../../src/features/auth/OtpForm';
import { PhoneForm } from '../../src/features/auth/PhoneForm';
import { auth } from '../../src/lib/repositories';
import { spacing } from '../../src/lib/theme';
import { useSession } from '../../src/providers/SessionProvider';

type Step = { kind: 'phone' } | { kind: 'otp'; phone: string };

/** Phone OTP sign-in as a modal (spec 06; ADR 0011). Talks to the `AuthGateway` only. */
export default function SignInScreen() {
  const router = useRouter();
  const { refreshSession, settleSignIn } = useSession();
  const [step, setStep] = useState<Step>({ kind: 'phone' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Closing the sheet without signing in settles any `requireSession()` that opened it.
  useEffect(
    () => () => {
      settleSignIn();
    },
    [settleSignIn],
  );

  const sendCode = async (phone: string) => {
    setPending(true);
    setError(null);
    try {
      await auth.signInWithPhone(phone);
      setStep({ kind: 'otp', phone });
    } catch (cause) {
      console.error('OTP request failed', cause);
      setError(authErrorMessage(cause, 'send'));
    } finally {
      setPending(false);
    }
  };

  const verify = async (phone: string, token: string) => {
    setPending(true);
    setError(null);
    try {
      await auth.verifyOtp(phone, token);
      // Read the session back before closing, so the opener's requireSession() resolves with it.
      await refreshSession();
      router.back();
    } catch (cause) {
      console.error('OTP verification failed', cause);
      setError(authErrorMessage(cause, 'verify'));
      setPending(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step.kind === 'phone' ? (
          <PhoneForm
            pending={pending}
            error={error}
            onSubmit={(phone) => {
              void sendCode(phone);
            }}
          />
        ) : (
          <OtpForm
            phone={step.phone}
            pending={pending}
            error={error}
            onSubmit={(token) => {
              void verify(step.phone, token);
            }}
            onResend={() => {
              void sendCode(step.phone);
            }}
            onChangeNumber={() => {
              setError(null);
              setStep({ kind: 'phone' });
            }}
          />
        )}
        <Button
          label="Not now"
          variant="ghost"
          onPress={() => {
            router.back();
          }}
          disabled={pending}
          block
          style={styles.dismiss}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dismiss: {
    marginTop: spacing.lg,
  },
});
