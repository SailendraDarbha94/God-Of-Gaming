import { IsoInstant, Slug, Uuid } from '@gog/domain';
import { z } from 'zod';

/** `book/[tierId]`: the tier plus the cafe slug, which carries the hours and the tier's rate. */
export const BookStepParams = z.object({
  tierId: Uuid,
  cafe: Slug,
});

/** `book/[tierId]/review`: step 1's choices travel as query parameters. */
export const ReviewParams = BookStepParams.extend({
  startsAt: IsoInstant,
  duration: z.coerce.number().int().positive(),
  seats: z.coerce.number().int().positive(),
});

/** `booking/[id]`; `quoted` is the total the review step showed when it differs from the hold's. */
export const BookingIdParams = z.object({
  id: Uuid,
  quoted: z.coerce.number().int().nonnegative().optional(),
});
