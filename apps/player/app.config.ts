/// <reference types="expo/types" />
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Node evaluates this file (no TypeScript imports), so the brand colours come from JSON shared
// with src/lib/theme.ts.
import palette from './src/lib/palette.json';

/**
 * Expo config (ADR 0008: native projects are generated from this file, never committed). The
 * product's working title lives here, in apps/web/src/config/site.ts and in copy only, so a rename
 * is a search-and-replace (spec README). Identifiers come from the environment with placeholders.
 */
const APP_NAME = 'God of Gaming';
const APP_VERSION = '0.1.0';
const PLACEHOLDER_APP_ID = 'com.gog.player';
const PLACEHOLDER_EAS_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

/**
 * Universal Links and App Links need a verified https host, served by apps/web with the
 * apple-app-site-association and assetlinks.json files. A local http site URL yields the `gog://`
 * scheme only.
 */
function linkHost(siteUrl: string | undefined): string | undefined {
  if (siteUrl === undefined) {
    return undefined;
  }
  const url = new URL(siteUrl);
  return url.protocol === 'https:' ? url.host : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const host = linkHost(nonBlank(process.env.EXPO_PUBLIC_SITE_URL));
  const bundleIdentifier = nonBlank(process.env.IOS_BUNDLE_ID) ?? PLACEHOLDER_APP_ID;
  const androidPackage = nonBlank(process.env.ANDROID_PACKAGE) ?? PLACEHOLDER_APP_ID;
  const easProjectId = nonBlank(process.env.EAS_PROJECT_ID) ?? PLACEHOLDER_EAS_PROJECT_ID;

  return {
    ...config,
    name: APP_NAME,
    slug: 'gog-player',
    scheme: 'gog',
    version: APP_VERSION,
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    icon: './assets/icon.png',
    backgroundColor: palette.background,
    ios: {
      bundleIdentifier,
      supportsTablet: false,
      associatedDomains: host === undefined ? undefined : [`applinks:${host}`],
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: palette.background,
      },
      intentFilters:
        host === undefined
          ? undefined
          : [
              {
                action: 'VIEW',
                autoVerify: true,
                // `pathPrefix` is a literal string prefix. The trailing slash is what keeps the
                // website's `/cafes` list page (and `/cafes?area=…`) out of the app: the link claims
                // cafe detail pages only, `https://<host>/cafes/*`, like the iOS AASA (spec 06).
                data: [{ scheme: 'https', host, pathPrefix: '/cafes/' }],
                category: ['BROWSABLE', 'DEFAULT'],
              },
            ],
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: palette.background,
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: easProjectId,
      },
    },
  };
};
