/**
 * The one ordering every named list in this package uses: the fixture dataset, the fixture
 * repository and the Supabase repository (which applies it after PostgREST's `order()`, so a database
 * collation of `C` versus `en_US` can never make the two implementations disagree about where
 * `BTM Layout` sits among `Banashankari` and `Bellandur`).
 */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, 'en');
}
