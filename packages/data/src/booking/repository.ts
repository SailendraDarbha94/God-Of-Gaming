import type {
  AvailabilityRequest,
  AvailabilitySlot,
  Booking,
  BookingRequest,
  Uuid,
} from '@gog/domain';

/**
 * The booking flow (spec 04, ADR 0005, 0012): availability, hold, confirm, cancel, my bookings.
 * Business failures are `BookingError` (`@gog/domain`), mapped from the SQLSTATEs of
 * `03-database.md`; transport failures are `DataError`. `createHold` retries once on
 * `seat_conflict` before rethrowing.
 */
export interface BookingRepository {
  getAvailability(request: AvailabilityRequest): Promise<AvailabilitySlot[]>;
  createHold(request: BookingRequest): Promise<Booking>;
  confirm(bookingId: Uuid): Promise<Booking>;
  cancel(bookingId: Uuid): Promise<Booking>;
  /** The caller's bookings, newest start first. */
  listMine(): Promise<Booking[]>;
}
