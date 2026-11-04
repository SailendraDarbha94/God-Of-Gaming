import { Slug } from '@gog/domain';
import { z } from 'zod';

/** `cafe/[slug]` and the `cafes/[slug]` redirect: the slug must be a well-formed catalog slug. */
export const CafeSlugParams = z.object({ slug: Slug });
