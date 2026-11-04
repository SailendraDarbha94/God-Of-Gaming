import { Redirect } from 'expo-router';

/**
 * The website's `/cafes` list page has no screen of its own in the app; Explore is the list. The
 * Android App Link filter claims `/cafes/` as a literal prefix, so a stale or odd link such as
 * `https://<host>/cafes/` (trailing slash, which Expo Router normalises to `/cafes`) lands here
 * instead of on "That screen does not exist".
 */
export default function CafesWebLinkRedirect() {
  return <Redirect href="/" />;
}
