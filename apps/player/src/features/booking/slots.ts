import {
  BOOKING_RULES,
  addDays,
  instantToIst,
  slotStarts,
  validateBookingRequest,
  type AvailabilitySlot,
  type BookingRequest,
  type IsoInstant,
  type LocalDate,
  type Minutes,
  type OpeningHours,
  type Uuid,
  type ValidationIssueCode,
} from '@gog/domain';

import { formatDayLabel } from '../../lib/format';

/**
 * Glue between the domain's opening-hour rules and the booking screens. The decisions (which day
 * a slot belongs to, which requests are valid) are the domain's; this module only lays them out.
 */

export interface DayOption {
  day: LocalDate;
  label: string;
}

export interface SlotOption {
  startsAt: IsoInstant;
  freeSeats: number;
  /** Enough seats and a request the domain accepts right now (lead time, horizon). */
  selectable: boolean;
}

export interface BookingDraft {
  cafeId: Uuid;
  tierId: Uuid;
  durationMinutes: Minutes;
  seatCount: number;
}

const PICKER_DAYS = 14;

function requestFor(draft: BookingDraft, startsAt: IsoInstant): BookingRequest {
  return {
    cafeId: draft.cafeId,
    tierId: draft.tierId,
    startsAt,
    durationMinutes: draft.durationMinutes,
    seatCount: draft.seatCount,
  };
}

/** Why the domain would refuse a start now; `[]` when it would accept it. */
function issuesFor(
  draft: BookingDraft,
  startsAt: IsoInstant,
  now: IsoInstant,
): ValidationIssueCode[] {
  const result = validateBookingRequest(requestFor(draft, startsAt), now);
  return result.ok ? [] : result.error.map((issue) => issue.code);
}

/** A start whose lead time has passed is gone, not greyed out: a disabled cell reads as "fully booked". */
function hasPassed(draft: BookingDraft, startsAt: IsoInstant, now: IsoInstant): boolean {
  return issuesFor(draft, startsAt, now).includes('start_too_soon');
}

/** The starts of an opening day the player can still be offered: the domain's grid minus those that have passed. */
export function upcomingStarts(
  hours: OpeningHours[],
  day: LocalDate,
  draft: BookingDraft,
  now: IsoInstant,
): IsoInstant[] {
  return slotStarts(hours, day, { durationMinutes: draft.durationMinutes }).filter(
    (start) => !hasPassed(draft, start, now),
  );
}

/**
 * The opening days a player can pick: today plus 13 days, keeping only days with at least one start
 * the rules still accept, so "No slots on this day" is never the default. Just after midnight the
 * previous day's overnight window may still have starts left, and they belong to that day (spec 02
 * §Opening hours), so it is offered first as "Late night".
 */
export function dayOptions(
  hours: OpeningHours[],
  draft: BookingDraft,
  now: IsoInstant,
): DayOption[] {
  const today = instantToIst(now).day;
  const options: DayOption[] = [];

  const yesterday = addDays(today, -1);
  if (upcomingStarts(hours, yesterday, draft, now).length > 0) {
    options.push({ day: yesterday, label: 'Late night' });
  }

  for (let offset = 0; offset < PICKER_DAYS; offset += 1) {
    const day = addDays(today, offset);
    if (upcomingStarts(hours, day, draft, now).length > 0) {
      options.push({ day, label: formatDayLabel(day, today) });
    }
  }
  return options;
}

/** Availability as cells: starts that have passed are dropped; the rest are selectable when the squad fits. */
export function toSlotOptions(
  slots: AvailabilitySlot[],
  draft: BookingDraft,
  now: IsoInstant,
): SlotOption[] {
  return slots.flatMap((slot) => {
    const issues = issuesFor(draft, slot.startsAt, now);
    if (issues.includes('start_too_soon')) {
      return [];
    }
    return [
      {
        startsAt: slot.startsAt,
        freeSeats: slot.freeSeats,
        selectable: issues.length === 0 && slot.freeSeats >= draft.seatCount,
      },
    ];
  });
}

/** Every allowed duration, from the minimum to the maximum in steps (spec 02 §Constants). */
export function durationOptions(): Minutes[] {
  const options: Minutes[] = [];
  for (
    let minutes = BOOKING_RULES.minMinutes;
    minutes <= BOOKING_RULES.maxMinutes;
    minutes += BOOKING_RULES.stepMinutes
  ) {
    options.push(minutes);
  }
  return options;
}
