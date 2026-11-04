import {
  createAuthGateway,
  createBookingRepository,
  createCatalogRepository,
} from '@gog/data/factory';

import { clock } from './clock';
import { env } from './env';
import { createSupabase } from './supabase';

/**
 * The app's single set of repositories, built once from the environment (spec 06 §Data and session).
 * Screens never see Supabase: they call these through the feature hooks. Both sources read the one
 * app clock: on fixtures the in-memory holds expire against it, on Supabase it is corrected by the
 * server's responses.
 */
const options =
  env.supabase === null
    ? ({ source: 'fixtures', now: clock.now } as const)
    : ({ source: 'supabase', client: createSupabase(env.supabase) } as const);

export const catalog = createCatalogRepository(options);
export const booking = createBookingRepository(options);
export const auth = createAuthGateway(options);
