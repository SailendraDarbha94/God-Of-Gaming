import {
  BOOKING_RULES,
  type Cafe,
  type IsoInstant,
  type LocalDate,
  type Minutes,
  type StationTier,
} from '@gog/domain';
import { useMemo, useState } from 'react';

import { useNow } from '../../lib/useNow';
import { useAvailability } from './queries';
import {
  dayOptions,
  toSlotOptions,
  upcomingStarts,
  type BookingDraft,
  type DayOption,
  type SlotOption,
} from './slots';

const DEFAULT_DURATION_MINUTES: Minutes = 60;
const DEFAULT_SEAT_COUNT = 1;

export interface BookingDraftState {
  durationMinutes: Minutes;
  setDurationMinutes: (minutes: Minutes) => void;
  seatCount: number;
  setSeatCount: (seats: number) => void;
  /** The squad limit for this tier: the booking rule or the tier's station count, whichever is lower. */
  maxSeats: number;
  days: DayOption[];
  /** The chosen opening day, falling back to the first available one. */
  day: LocalDate | null;
  setDay: (day: LocalDate) => void;
  availability: ReturnType<typeof useAvailability>;
  slots: SlotOption[];
  /** How many starts the domain predicts for the day, for the loading grid. */
  expectedSlotCount: number;
  /** The chosen start, only while it is still selectable with the current seats and duration. */
  selectedSlot: SlotOption | null;
  setStartsAt: (startsAt: IsoInstant) => void;
}

/**
 * Step 1 of the booking flow as state: day, duration, seats and the chosen start, with every
 * derived value recomputed from the domain rules so the screen only lays things out. "Now" is
 * state refreshed on a timer, so the day list and the slot grid agree on it and both move on when
 * the screen stays open past a closing time or past midnight.
 */
export function useBookingDraft(cafe: Cafe | null, tier: StationTier | null): BookingDraftState {
  const [durationMinutes, setDurationMinutes] = useState<Minutes>(DEFAULT_DURATION_MINUTES);
  const [requestedSeats, setSeatCount] = useState(DEFAULT_SEAT_COUNT);
  const [chosenDay, setDay] = useState<LocalDate | null>(null);
  const [startsAt, setStartsAt] = useState<IsoInstant | null>(null);
  const now = useNow();

  // A squad cannot outnumber the tier's stations; clamping beats greying out every slot.
  const maxSeats =
    tier === null
      ? BOOKING_RULES.maxSeats
      : Math.max(BOOKING_RULES.minSeats, Math.min(BOOKING_RULES.maxSeats, tier.stationCount));
  const seatCount = Math.min(requestedSeats, maxSeats);

  const draft = useMemo<BookingDraft | null>(
    () =>
      cafe === null || tier === null
        ? null
        : { cafeId: cafe.id, tierId: tier.id, durationMinutes, seatCount },
    [cafe, tier, durationMinutes, seatCount],
  );

  const days = useMemo(
    () => (cafe === null || draft === null ? [] : dayOptions(cafe.hours, draft, now)),
    [cafe, draft, now],
  );

  const day = days.some((option) => option.day === chosenDay) ? chosenDay : (days[0]?.day ?? null);

  const availability = useAvailability(
    tier === null || day === null ? null : { tierId: tier.id, day, durationMinutes },
  );

  const slots =
    availability.data === undefined || draft === null
      ? []
      : toSlotOptions(availability.data, draft, now);

  const expectedSlotCount =
    cafe === null || day === null || draft === null
      ? 0
      : upcomingStarts(cafe.hours, day, draft, now).length;

  const selectedSlot = slots.find((slot) => slot.startsAt === startsAt && slot.selectable) ?? null;

  return {
    durationMinutes,
    setDurationMinutes,
    seatCount,
    setSeatCount,
    maxSeats,
    days,
    day,
    setDay,
    availability,
    slots,
    expectedSlotCount,
    selectedSlot,
    setStartsAt,
  };
}
