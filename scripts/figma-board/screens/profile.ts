/** app/(tabs)/profile.tsx */
import appConfig from '@app/../app.config';
import { formatPhoneForDisplay } from '@app/lib/format';
import { Phone, Screen } from '@board/chrome';
import { ListRow, Section } from '@board/components/shared';
import { spacing, type Frame, type Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';
import { Button, Card, Text, type Link } from '@board/ui';

const ROUTE = 'app/(tabs)/profile.tsx';

// Constants.expoConfig (profile.tsx:23-24) is what apps/player/app.config.ts returns. The app has no
// app.json, so the static config it is handed is empty and the name and version are the file's own
// (app.config.ts:44 and :47). Its only expo import is a type, so it loads here.
const expoConfig = appConfig({
  projectRoot: '',
  staticConfigPath: null,
  packageJsonPath: null,
  config: {},
});

interface ProfileProps {
  /** useSession().session */
  session: Scenario['session'] | null;
  /** useState(false): true from the tap on "Sign out" until signOut() settles. */
  signingOut?: boolean;
  /** router.push('/auth/sign-in') */
  signIn?: Link;
  /** onSignOut: the session becomes null and this same route renders its signed-out card. */
  signOut?: Link;
}

/** ProfileScreen(): <Screen scroll> with the account card, the About section and the version line. */
function Profile({ session, signingOut = false, signIn, signOut }: ProfileProps): Frame {
  const appName = expoConfig.name;
  const version = expoConfig.version ?? 'dev';
  // Digits without `+`, as `AuthSession.phone` and `profiles.phone` store it (spec 02).
  const phone = session?.phone ?? null;

  return Screen(
    { scroll: true },
    session === null
      ? Card(
          { gap: spacing.sm },
          Text('You are not signed in', { variant: 'subheading' }),
          Text('Sign in with your mobile number to hold seats for your squad.', { tone: 'muted' }),
          Button({ label: 'Sign in', style: { mt: spacing.sm }, ...signIn }),
        )
      : Card(
          { gap: spacing.sm },
          ListRow({
            label: 'Phone',
            value: phone === null ? 'Not available' : formatPhoneForDisplay(phone),
          }),
          ListRow({
            label: 'Display name',
            value: 'Not set',
            hint: 'Editable in a later release.',
          }),
          Button({
            label: 'Sign out',
            variant: 'secondary',
            loading: signingOut,
            style: { mt: spacing.sm },
            // A loading button is disabled, so it carries no link.
            ...(signingOut ? {} : signOut),
          }),
        ),

    Section(
      { title: 'About' },
      Card(
        {},
        // Linking.openURL(siteUrls.privacy | terms | home): each row leaves the app, so no link.
        ListRow({ label: 'Privacy', press: {} }),
        ListRow({ label: 'Terms', press: {} }),
        ListRow({ label: 'Website', press: {} }),
      ),
    ),

    Text(`${appName} · v${version}`, {
      variant: 'caption',
      tone: 'subtle',
      mt: spacing.xl,
      align: 'center',
    }),
  );
}

export function screens(s: Scenario): BoardScreen[] {
  return [
    Phone({
      key: 'profile',
      name: 'Profile',
      route: ROUTE,
      note: 'The third tab while signed in: the phone number the player signed in with, and "Sign out". The About rows open the website in the browser.',
      header: { title: 'Profile' },
      tabs: { active: 'profile' },
      content: Profile({
        session: s.session,
        signOut: { go: 'profile-signed-out', goHow: 'replace' },
      }),
    }),
    Phone({
      key: 'profile-signed-out',
      name: 'Profile · signed out',
      route: ROUTE,
      note: 'The third tab with no session: before the first sign-in, or right after "Sign out". "Sign in" opens the sign-in sheet.',
      header: { title: 'Profile' },
      // With no session the Bookings tab shows its own signed-out state.
      tabs: { active: 'profile', targets: { bookings: 'bookings-signed-out' } },
      content: Profile({
        session: null,
        signIn: { go: 'sign-in', goHow: 'modal' },
      }),
    }),
    Phone({
      key: 'profile-signing-out',
      name: 'Profile · signing out',
      route: ROUTE,
      note: 'The moment after "Sign out" is tapped, while the request runs: the button dims and shows a spinner. The signed-out card replaces this one when it finishes.',
      header: { title: 'Profile' },
      tabs: { active: 'profile' },
      content: Profile({ session: s.session, signingOut: true }),
    }),
  ];
}
