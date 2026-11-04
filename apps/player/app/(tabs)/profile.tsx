import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ListRow } from '../../src/components/ListRow';
import { Section } from '../../src/components/Section';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { formatPhoneForDisplay } from '../../src/lib/format';
import { siteUrls } from '../../src/lib/site';
import { spacing } from '../../src/lib/theme';
import { useSession } from '../../src/providers/SessionProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const appName = Constants.expoConfig?.name ?? 'the app';
  const version = Constants.expoConfig?.version ?? 'dev';
  // Digits without `+`, as `AuthSession.phone` and `profiles.phone` store it (spec 02).
  const phone = session?.phone ?? null;

  const onSignOut = () => {
    setSigningOut(true);
    void signOut()
      .catch((error: unknown) => {
        console.error('Sign out failed', error);
      })
      .finally(() => {
        setSigningOut(false);
      });
  };

  const open = (url: string) => () => {
    void Linking.openURL(url);
  };

  return (
    <Screen scroll>
      {session === null ? (
        <Card style={styles.card}>
          <Text variant="subheading">You are not signed in</Text>
          <Text tone="muted">Sign in with your mobile number to hold seats for your squad.</Text>
          <Button
            label="Sign in"
            onPress={() => {
              router.push('/auth/sign-in');
            }}
            style={styles.action}
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          <ListRow
            label="Phone"
            value={phone === null ? 'Not available' : formatPhoneForDisplay(phone)}
          />
          <ListRow label="Display name" value="Not set" hint="Editable in a later release." />
          <Button
            label="Sign out"
            variant="secondary"
            onPress={onSignOut}
            loading={signingOut}
            style={styles.action}
          />
        </Card>
      )}

      <Section title="About">
        <Card>
          <ListRow label="Privacy" onPress={open(siteUrls.privacy)} />
          <ListRow label="Terms" onPress={open(siteUrls.terms)} />
          <ListRow label="Website" onPress={open(siteUrls.home)} />
        </Card>
      </Section>

      <Text variant="caption" tone="subtle" style={styles.version}>
        {appName} · v{version}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  action: {
    marginTop: spacing.sm,
  },
  version: {
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
