/** app/book/[tierId]/index.tsx: step 1 of booking, "Pick a time". */
import { formatRatePerHour, formatSeats } from '@app/lib/format';
import { DEVICE, Phone, Screen, type PhoneProps } from '@board/chrome';
import {
  DayPicker,
  DurationPicker,
  SeatStepper,
  SlotGrid,
  SlotGridSkeleton,
} from '@board/components/booking';
import { EmptyState, ErrorState, Section, Skeleton } from '@board/components/shared';
import { box, spacing, type Frame, type Screen as BoardScreen } from '@board/dsl';
import type { DraftSnapshot, Scenario } from '@board/scenario';
import { Button, Text, type Link } from '@board/ui';
import { formatIstTime, type IsoInstant, type LocalDate, type Minutes } from '@gog/domain';

const ROUTE = 'app/book/[tierId]/index.tsx';

/** app/_layout.tsx: <Stack.Screen name="book/[tierId]/index" options={{ title: 'Pick a time' }} />. */
const HEADER: PhoneProps['header'] = { title: 'Pick a time', back: true };

/** The width a padded Screen leaves its children, which the skeletons' percentages are worked out against. */
const CONTENT_WIDTH = DEVICE.w - 2 * spacing.lg;

/** useAvailability()'s three outcomes, as the "Start time" section branches on them. */
type Availability = 'pending' | 'error' | 'loaded';

/** One link per setter of useBookingDraft, plus the two buttons. */
interface PickLinks {
  /** draft.setDay */
  day?: (day: LocalDate) => Link | undefined;
  /** draft.setDurationMinutes */
  duration?: (minutes: Minutes) => Link | undefined;
  /** draft.setSeatCount */
  seats?: (seats: number) => Link | undefined;
  /** draft.setStartsAt */
  start?: (startsAt: IsoInstant) => Link | undefined;
  /** availability.refetch(), on the section's "Try again" */
  retry?: Link;
  /** continueToReview */
  continue?: Link;
}

/** router.replace('/') */
const BACK_TO_EXPLORE: Link = { go: 'explore', goHow: 'replace' };

/** The route's last return: the form, for one value of useBookingDraft(). */
function PickTime(
  s: Scenario,
  draft: DraftSnapshot,
  availability: Availability,
  links: PickLinks = {},
): Frame {
  const { day, selectedSlot } = draft;
  return Screen(
    { scroll: true },
    Text(s.tier.name, { variant: 'heading' }),
    Text(`${s.cafe.name} · ${formatRatePerHour(s.tier.hourlyRatePaise)} per seat`, {
      tone: 'muted',
    }),

    Section(
      { title: 'Day' },
      draft.days.length === 0
        ? Text('No opening day fits this duration in the next two weeks.', { tone: 'muted' })
        : DayPicker({ options: draft.days, value: day, change: links.day }),
    ),

    Section(
      { title: 'Duration' },
      DurationPicker({ value: draft.durationMinutes, change: links.duration }),
    ),

    Section(
      { title: 'Seats' },
      SeatStepper({ value: draft.seatCount, max: draft.maxSeats, change: links.seats }),
    ),

    Section(
      { title: 'Start time' },
      day === null
        ? null
        : availability === 'pending'
          ? SlotGridSkeleton({ count: draft.expectedSlotCount })
          : availability === 'error'
            ? ErrorState({ title: 'Could not load free seats', retry: links.retry ?? {} })
            : draft.slots.length === 0
              ? Text('No slots left on this day. Try another day or a shorter session.', {
                  tone: 'muted',
                })
              : box(
                  { name: 'slots', gap: spacing.sm },
                  draft.slots.some((slot) => slot.selectable)
                    ? null
                    : Text(
                        `No start has ${formatSeats(draft.seatCount)} free. Try fewer seats or another day.`,
                        { tone: 'muted' },
                      ),
                  SlotGrid({
                    day,
                    slots: draft.slots,
                    value: selectedSlot?.startsAt ?? null,
                    change: links.start,
                  }),
                ),
    ),

    Button({
      label: 'Continue',
      disabled: selectedSlot === null,
      block: true,
      style: { mt: spacing.xl },
      // A disabled Button does not fire onPress.
      ...(selectedSlot === null ? {} : links.continue),
    }),
  );
}

/** What the hook returns while its availability query has no data: no slots, so nothing selected. */
function withoutSlots(draft: DraftSnapshot): DraftSnapshot {
  return { ...draft, slots: [], selectedSlot: null };
}

export function screens(s: Scenario): BoardScreen[] {
  const toChosen: Link = { go: 'pick-chosen', goHow: 'replace' };
  const chosen = s.pickChosen;
  const chosenTime =
    chosen.selectedSlot === null
      ? null
      : formatIstTime(chosen.selectedSlot.startsAt, { style: 'short' });

  // Sunday's starts that cannot seat the story's squad: the only short-of-seats cells in the sample data.
  const shortStarts = chosen.slots.filter((slot) => !slot.selectable);

  const frames: (BoardScreen | null)[] = [
    // ----- The story -----
    Phone({
      key: 'pick',
      name: 'Pick a time',
      route: ROUTE,
      note: 'As the step opens from "Book" on the cafe: 1 h, one seat, the first open day, no start chosen, so Continue is off. Tomorrow, 2 h, + and 7:30 pm lead to the chosen state.',
      mode: 'full',
      header: HEADER,
      content: PickTime(s, s.pickInitial, 'loaded', {
        day: (day) => (day === chosen.day && day !== s.pickInitial.day ? toChosen : undefined),
        duration: (minutes) =>
          minutes === chosen.durationMinutes && minutes !== s.pickInitial.durationMinutes
            ? toChosen
            : undefined,
        // Only the plus button moves towards the story's squad size.
        seats: (seats) =>
          seats > s.pickInitial.seatCount && seats <= chosen.seatCount ? toChosen : undefined,
        // The cell with the story's time of day; the story's own start is that time on the next day.
        start: (startsAt) =>
          formatIstTime(startsAt, { style: 'short' }) === chosenTime ? toChosen : undefined,
      }),
    }),
    Phone({
      key: 'pick-chosen',
      name: 'Pick a time · chosen',
      route: ROUTE,
      note: 'After the player picks Tomorrow, 2 h, four seats and 7:30 pm. Starts with fewer than four free seats are dimmed; Continue opens Review.',
      mode: 'full',
      header: HEADER,
      content: PickTime(s, chosen, 'loaded', { continue: { go: 'review', goHow: 'push' } }),
    }),

    // ----- cafe.isPending -----
    Phone({
      key: 'pick-loading',
      name: 'Pick a time · loading',
      route: ROUTE,
      note: 'While the cafe is still loading, for a player who lands here without it cached (a deep link).',
      header: HEADER,
      content: Screen(
        { scroll: true },
        box(
          { name: 'skeletons', gap: spacing.md },
          Skeleton({ width: CONTENT_WIDTH * 0.6, height: 28 }),
          Skeleton({ width: CONTENT_WIDTH * 0.4, height: 16 }),
          Skeleton({ height: 44 }),
          Skeleton({ height: 44 }),
        ),
      ),
    }),

    // ----- availability.isPending -----
    Phone({
      key: 'pick-slots-loading',
      name: 'Pick a time · starts loading',
      route: ROUTE,
      note: 'The first moment of the step, and again after every change of day or duration: the free seats are being fetched, one placeholder per start the day should have.',
      mode: 'full',
      header: HEADER,
      content: PickTime(s, withoutSlots(s.pickInitial), 'pending'),
    }),

    // ----- No slot is selectable: the note above a fully dimmed grid -----
    shortStarts.length === 0
      ? null
      : Phone({
          key: 'pick-no-fit',
          name: 'Pick a time · no start fits',
          route: ROUTE,
          note: 'When every start left on the day has fewer free seats than the squad. Drawn with only the Sunday starts that are short for four seats; the sample day itself still has starts that fit.',
          mode: 'full',
          header: HEADER,
          content: PickTime(s, { ...chosen, slots: shortStarts, selectedSlot: null }, 'loaded'),
        }),

    // ----- draft.slots.length === 0 -----
    Phone({
      key: 'pick-no-slots',
      name: 'Pick a time · no slots',
      route: ROUTE,
      note: 'When the server returns no starts for a day the picker offered, such as a cafe paused or its hours changed since the catalog was loaded.',
      header: HEADER,
      content: PickTime(s, withoutSlots(s.pickInitial), 'loaded'),
    }),

    // ----- draft.days.length === 0 -----
    Phone({
      key: 'pick-no-days',
      name: 'Pick a time · no day fits',
      route: ROUTE,
      note: 'When no opening day in the next two weeks has a start for this duration. No sample cafe is open that briefly, so the day list is emptied by hand here.',
      header: HEADER,
      content: PickTime(
        s,
        { ...withoutSlots(s.pickInitial), days: [], day: null, expectedSlotCount: 0 },
        'loaded',
      ),
    }),

    // ----- availability.isError -----
    Phone({
      key: 'pick-slots-error',
      name: 'Pick a time · starts failed',
      route: ROUTE,
      note: 'When the free seats could not be fetched. "Try again" refetches them; the rest of the form stays usable.',
      header: HEADER,
      // A refetch with no data yet puts the query back to pending, so the placeholders return.
      content: PickTime(s, withoutSlots(s.pickInitial), 'error', {
        retry: { go: 'pick-slots-loading', goHow: 'replace' },
      }),
    }),

    // ----- cafe.isError -----
    Phone({
      key: 'pick-error',
      name: 'Pick a time · error',
      route: ROUTE,
      note: 'When the cafe could not be loaded. "Try again" refetches it.',
      header: HEADER,
      // A refetch with no data yet puts the query back to pending, so the skeleton returns.
      content: Screen({}, ErrorState({ retry: { go: 'pick-loading', goHow: 'replace' } })),
    }),

    // ----- cafe.data === null || tier === null -----
    Phone({
      key: 'pick-not-found',
      name: 'Pick a time · tier gone',
      route: ROUTE,
      note: 'When the cafe or the tier in the link is no longer listed.',
      header: HEADER,
      content: Screen(
        {},
        EmptyState({
          title: 'This station tier is no longer listed',
          actionLabel: 'Back to Explore',
          action: BACK_TO_EXPLORE,
        }),
      ),
    }),

    // ----- !params.ok -----
    Phone({
      key: 'pick-bad-link',
      name: 'Pick a time · incomplete link',
      route: ROUTE,
      note: 'When the link lacks a valid tier id or cafe slug, which only a hand-made deep link does.',
      header: HEADER,
      content: Screen(
        {},
        EmptyState({
          title: 'Nothing to book here',
          message: 'The link is incomplete.',
          actionLabel: 'Back to Explore',
          action: BACK_TO_EXPLORE,
        }),
      ),
    }),
  ];

  return frames.filter((frame): frame is BoardScreen => frame !== null);
}
