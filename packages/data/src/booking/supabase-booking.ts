import {
  BookingError,
  type AvailabilityRequest,
  type AvailabilitySlot,
  type Booking,
  type BookingRequest,
  type Uuid,
} from '@gog/domain';
import type { DataClient } from '../client';
import {
  dataErrorFromPostgrest,
  isTransportFailure,
  type DataError,
  type PostgrestFailure,
} from '../errors';
import { parseRows } from '../parse';
import { parseAvailabilityRequest } from './availability-request';
import { mapPostgrestError } from './errors';
import { toAvailabilitySlot, toBooking } from './mappers';
import type { BookingRepository } from './repository';

/**
 * The booking flow over the SQL functions of spec 03 (ADR 0005): every write is an RPC and the
 * database is the final word on seats. The three transition RPCs return a `booking_details` row,
 * so no second fetch follows a hold, confirm or cancel; `listMine` reads the same view (never the
 * `bookings` table with catalog embeds, whose RLS would null out paused cafes).
 */
export class SupabaseBookingRepository implements BookingRepository {
  constructor(private readonly client: DataClient) {}

  async getAvailability(request: AvailabilityRequest): Promise<AvailabilitySlot[]> {
    const parsed = parseAvailabilityRequest(request);
    const { data, error } = await this.client.rpc('get_availability', {
      p_tier_id: parsed.tierId,
      p_day: parsed.day,
      p_duration_minutes: parsed.durationMinutes,
      p_step_minutes: parsed.stepMinutes,
    });
    if (error !== null) {
      throw bookingFailure('get_availability', error);
    }
    return parseRows(data, 'get_availability result').map(toAvailabilitySlot);
  }

  /** Retries once on `seat_conflict` (`GG005`, the exclusion-constraint safety net), then rethrows. */
  async createHold(request: BookingRequest): Promise<Booking> {
    try {
      return await this.hold(request);
    } catch (error) {
      if (error instanceof BookingError && error.retryable) {
        return await this.hold(request);
      }
      throw error;
    }
  }

  async confirm(bookingId: Uuid): Promise<Booking> {
    const { data, error } = await this.client.rpc('confirm_booking', { p_booking_id: bookingId });
    if (error !== null) {
      throw bookingFailure('confirm_booking', error);
    }
    return toBooking(data);
  }

  async cancel(bookingId: Uuid): Promise<Booking> {
    const { data, error } = await this.client.rpc('cancel_booking', { p_booking_id: bookingId });
    if (error !== null) {
      throw bookingFailure('cancel_booking', error);
    }
    return toBooking(data);
  }

  /** Newest start first; equal starts (a re-held slot) newest hold first, like the fixture. */
  async listMine(): Promise<Booking[]> {
    const { data, error } = await this.client
      .from('booking_details')
      .select('*')
      .order('starts_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (error !== null) {
      throw dataErrorFromPostgrest('listMine', error);
    }
    return parseRows(data, 'booking_details').map(toBooking);
  }

  private async hold(request: BookingRequest): Promise<Booking> {
    const { data, error } = await this.client.rpc('create_booking', {
      p_cafe_id: request.cafeId,
      p_tier_id: request.tierId,
      p_starts_at: request.startsAt,
      p_duration_minutes: request.durationMinutes,
      p_seat_count: request.seatCount,
    });
    if (error !== null) {
      throw bookingFailure('create_booking', error);
    }
    return toBooking(data);
  }
}

/** A request that never got a response stays a `DataError`; every answered error is a business code. */
function bookingFailure(what: string, error: PostgrestFailure): DataError | BookingError {
  return isTransportFailure(error) ? dataErrorFromPostgrest(what, error) : mapPostgrestError(error);
}
