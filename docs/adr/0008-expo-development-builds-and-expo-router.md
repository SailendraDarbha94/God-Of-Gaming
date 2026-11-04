# 0008. Expo development builds, Expo Router, generated native projects

Date: 2026-11-04
Status: Accepted

## Context

The player app needs native capabilities from day one: secure session storage, Universal Links / App Links, later push notifications and payments SDKs. Store builds and over-the-air updates should not require a Mac build farm run by hand.

## Decision

- Expo SDK 58 with the New Architecture. The app runs as a development build (`expo-dev-client`), never in Expo Go.
- Expo Router for file-based navigation; it also handles deep links (`gog://` scheme and `https://` Universal Links / App Links) into `cafe/[slug]` and other routes.
- Continuous Native Generation: `ios/` and `android/` are not committed. `expo prebuild` or EAS generates them from `app.config.ts` and config plugins.
- EAS Build with `development`, `preview` and `production` profiles in `eas.json`. EAS Update is adopted later, in its own decision, once the first store release exists.
- Bundle identifiers, associated domains and store IDs come from environment variables read in `app.config.ts`, so renaming the product does not touch code.

## Consequences

- Any native change is a config plugin or an Expo module, reviewed in the pull request like other code.
- Running the app locally needs a development build installed on a simulator or device (`eas build --profile development` or `npx expo run:ios`); this is a one-time cost per native change.
- Expo Router's typed routes are enabled so navigation targets are checked by the compiler.
