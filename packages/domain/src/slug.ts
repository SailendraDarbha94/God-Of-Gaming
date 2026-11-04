import type { Slug } from './scalars';

const MAX_SLUG_LENGTH = 64;

/**
 * Lower-case ASCII words joined by single dashes: "Café Über!" → "cafe-uber". Diacritics are
 * stripped (NFKD, then every combining mark), apostrophes are dropped rather than split ("Rohan's"
 * → "rohans"), and the result is cut to 64 characters. Validate with `Slug` when the input is
 * untrusted: one character or no letters at all cannot produce a valid slug.
 */
export function slugify(input: string): Slug {
  const slug = input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length <= MAX_SLUG_LENGTH ? slug : slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, '');
}
