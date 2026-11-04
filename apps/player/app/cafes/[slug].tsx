import { Redirect } from 'expo-router';

import { CafeSlugParams } from '../../src/features/catalog/params';
import { useRouteParams } from '../../src/lib/params';

/**
 * The website's `/cafes/<slug>` URL shape, so a Universal Link or App Link opens the cafe screen
 * (spec 06 §Deep links). The app's own route is `cafe/[slug]`.
 */
export default function CafeWebLinkRedirect() {
  const params = useRouteParams(CafeSlugParams);
  if (!params.ok) {
    return <Redirect href="/" />;
  }
  return <Redirect href={{ pathname: '/cafe/[slug]', params: { slug: params.value.slug } }} />;
}
