import { describe } from 'vitest';
import { createPublicClient } from '../client';
import { describeCatalogRepository } from '../testing/catalog-contract';
import { SUPABASE_TEST_SKIP_REASON, supabaseTestTarget } from '../testing/supabase-env';
import { SupabaseCatalogRepository } from './supabase-catalog';

/**
 * The contract suite against a real, seeded stack (`supabase start` locally, or any project with
 * the sample data). Skipped, with the reason in the suite name, unless the target is configured.
 */
const target = supabaseTestTarget();

describe.skipIf(target === null)(
  target === null
    ? `SupabaseCatalogRepository (skipped: ${SUPABASE_TEST_SKIP_REASON})`
    : 'SupabaseCatalogRepository',
  () => {
    describeCatalogRepository('against the configured stack', () => {
      if (target === null) {
        throw new Error(SUPABASE_TEST_SKIP_REASON);
      }
      return new SupabaseCatalogRepository(
        createPublicClient({ url: target.url, key: target.anonKey }),
      );
    });
  },
);
