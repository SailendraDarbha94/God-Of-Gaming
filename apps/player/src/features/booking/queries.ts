import {
  BOOKING_RULES,
  BookingError,
  type AvailabilityRequest,
  type Booking,
  type BookingRequest,
  type Uuid,
} from '@gog/domain';
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { booking } from '../../lib/repositories';

export const bookingKeys = {
  all: ['bookings'] as const,
  availability: (request: AvailabilityRequest) =>
    [
      ...bookingKeys.all,
      'availability',
      request.tierId,
      request.day,
      request.durationMinutes,
      request.stepMinutes ?? BOOKING_RULES.stepMinutes,
    ] as const,
  mine: () => [...bookingKeys.all, 'mine'] as const,
};

const AVAILABILITY_STALE_MS = 15_000;

/** Free seats per start for one tier, day and duration; `null` while the screen has no tier yet. */
export function useAvailability(request: AvailabilityRequest | null) {
  return useQuery({
    queryKey:
      request === null
        ? ([...bookingKeys.all, 'availability', 'pending'] as const)
        : bookingKeys.availability(request),
    queryFn: request === null ? skipToken : () => booking.getAvailability(request),
    staleTime: AVAILABILITY_STALE_MS,
  });
}

/** The signed-in player's bookings, newest first; disabled without a session. */
export function useMyBookings(enabled: boolean) {
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => booking.listMine(),
    enabled,
  });
}

/** One booking, found in "my bookings" (the repository has no single-booking read). */
export function useBooking(id: Uuid | null, enabled: boolean) {
  const mine = useMyBookings(enabled && id !== null);
  const found = mine.data?.find((candidate) => candidate.id === id) ?? null;
  return { query: mine, booking: found };
}

/** The order `listMine` returns on both data sources: newest start, then newest hold, first. */
function newestFirst(a: Booking, b: Booking): number {
  return (
    Date.parse(b.startsAt) - Date.parse(a.startsAt) ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

/** Puts a booking returned by an RPC into the cached list, keeping the repository order. */
function rememberBooking(queryClient: QueryClient, updated: Booking) {
  queryClient.setQueryData<Booking[]>(bookingKeys.mine(), (previous) =>
    [updated, ...(previous ?? []).filter((candidate) => candidate.id !== updated.id)].sort(
      newestFirst,
    ),
  );
  // Seats moved, so every cached availability grid may be stale.
  void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, 'availability'] });
}

/**
 * After `confirm_booking` answers `GG008` the row stays `held` until the sweeper or the next hold on
 * that tier expires it (spec 03), so a refetch would show a running countdown and a Confirm that
 * fails again. The cache takes the state the sweeper will produce.
 */
function markHoldLapsed(queryClient: QueryClient, id: Uuid) {
  queryClient.setQueryData<Booking[]>(bookingKeys.mine(), (previous) =>
    previous?.map((candidate) =>
      candidate.id === id && candidate.status === 'held'
        ? { ...candidate, status: 'expired' }
        : candidate,
    ),
  );
}

export function useCreateHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BookingRequest) => booking.createHold(request),
    onSuccess: (created) => {
      rememberBooking(queryClient, created);
    },
  });
}

export function useConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Uuid) => booking.confirm(id),
    onSuccess: (confirmed) => {
      rememberBooking(queryClient, confirmed);
    },
    onError: (error, id) => {
      if (error instanceof BookingError && error.code === 'invalid_state') {
        markHoldLapsed(queryClient, id);
      }
    },
  });
}

export function useCancel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Uuid) => booking.cancel(id),
    onSuccess: (cancelled) => {
      rememberBooking(queryClient, cancelled);
    },
  });
}
