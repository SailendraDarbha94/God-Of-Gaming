import type { CatalogRepository } from '@gog/data/catalog';
import { createPublicClient, systemClock } from '@gog/data/client';
import { createCatalogRepository } from '@gog/data/factory';
import type { IsoInstant } from '@gog/domain';

import { env } from '@/lib/env';

/**
 * One repository per request. Pages call this inside their render; the implementation is chosen
 * from `GOG_DATA_SOURCE` (ADR 0012) and the website only ever holds the anon key (ADR 0004).
 */
export function catalog(): CatalogRepository {
  const { data } = env;
  switch (data.source) {
    case 'fixtures':
      return createCatalogRepository({ source: 'fixtures' });
    case 'supabase':
      return createCatalogRepository({
        source: 'supabase',
        client: createPublicClient({ url: data.url, key: data.anonKey }),
      });
  }
}

export type Loaded<T> = { ok: true; value: T } | { ok: false };

/**
 * Runs one catalog read for an ISR page. A transport failure is logged and reported as `ok: false`
 * so the page can render a calm empty state; the build must not fail because Supabase is
 * unreachable (05-web.md, Data).
 */
export async function load<T>(what: string, read: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await read() };
  } catch (error) {
    console.error(`[web] ${what} failed; rendering an empty state`, error);
    return { ok: false };
  }
}

/** `load` for lists: a failure renders as "nothing here yet". */
export async function loadList<T>(what: string, read: () => Promise<T[]>): Promise<T[]> {
  const loaded = await load(what, read);
  return loaded.ok ? loaded.value : [];
}

/** The instant promotions are filtered against (`listPromotions({ at })`), in the domain's canonical form. */
export function now(): IsoInstant {
  return systemClock();
}
