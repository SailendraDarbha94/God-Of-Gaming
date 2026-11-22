/** app/book/[tierId]/review.tsx */
import { bookingErrorMessage } from '@app/features/booking/copy';
import { Phone, Screen } from '@board/chrome';
import { BookingSummary } from '@board/components/booking';
import { EmptyState, ErrorState, Notice, Skeleton } from '@board/components/shared';
import { box, radii, spacing, type Frame, type Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';
import { Button, Text, type Link } from '@board/ui';
import { BOOKING_RULES, BookingError, addMinutes, quote } from '@gog/domain';

const ROUTE = 'app/book/[tierId]/review.tsx';

/** app/_layout.tsx: <Stack.Screen name="book/[tierId]/review" options={{ title: 'Review' }} />, pushed from Pick a time. */
const HEADER = { title: 'Review', back: true } as const;

/** backToExplore: router.replace('/') */
const BACK_TO_EXPLORE: Link = { go: 'explore', goHow: 'replace' };

/** holdSeats, signed in and the hold created: router.replace({ pathname: '/booking/[id]', ... }) */
const HOLD_SEATS: Link = { go: 'booking-held', goHow: 'replace' };

/** "Change time": router.back() */
const CHANGE_TIME: Link = { back: true };

interface ReviewState {
  /** useState `notice` */
  notice: string | null;
  /** createHold.isPending */
  holding: boolean;
}

export function screens(s: Scenario): BoardScreen[] {
  // The route parameters Pick a time pushed (book/[tierId]/index.tsx, continueToReview).
  const { selectedSlot } = s.pickChosen;
  if (selectedSlot === null) {
    throw new Error('review: the scenario has no chosen start');
  }
  const params = {
    startsAt: selectedSlot.startsAt,
    duration: s.pickChosen.durationMinutes,
    seats: s.pickChosen.seatCount,
  };

  const data = s.cafe;
  const tier = s.tier;
  const { startsAt, duration, seats } = params;
  const endsAt = addMinutes(startsAt, duration);
  const price = quote({
    hourlyRatePaise: tier.hourlyRatePaise,
    durationMinutes: duration,
    seatCount: seats,
  });

  /** The route's last return: params ok, the cafe loaded, the tier found. */
  const review = ({ notice, holding }: ReviewState): Frame =>
    Screen(
      { scroll: true },
      Text('Review your hold', { variant: 'heading' }),
      Text(
        `Seats are held for ${BOOKING_RULES.holdMinutes} minutes while you confirm. You pay at the cafe.`,
        { tone: 'muted', mt: spacing.xs, mb: spacing.lg },
      ),
      BookingSummary({
        cafeName: data.name,
        tierName: tier.name,
        kind: tier.kind,
        startsAt,
        endsAt,
        seatCount: seats,
        hourlyRatePaise: tier.hourlyRatePaise,
        totalPaise: price.totalPaise,
      }),
      notice === null
        ? null
        : box({ name: 'notice', mt: spacing.lg }, Notice({ tone: 'error', message: notice })),
      Button({
        label: 'Hold seats',
        loading: holding,
        block: true,
        style: { mt: spacing.xl, mb: spacing.sm },
        // A loading Button is disabled, so it leads nowhere.
        ...(holding ? {} : HOLD_SEATS),
      }),
      Button({
        label: 'Change time',
        variant: 'ghost',
        disabled: holding,
        block: true,
        ...(holding ? {} : CHANGE_TIME),
      }),
    );

  return [
    Phone({
      key: 'review',
      name: 'Review',
      route: ROUTE,
      note: 'Step 2 of booking, signed in: the choices from Pick a time, priced. "Hold seats" creates the hold and opens it; "Change time" goes back.',
      header: HEADER,
      content: review({ notice: null, holding: false }),
    }),
    Phone({
      key: 'review-holding',
      name: 'Review · holding',
      route: ROUTE,
      note: 'Right after "Hold seats", while the hold is being created: the button shows a spinner and "Change time" is disabled.',
      header: HEADER,
      content: review({ notice: null, holding: true }),
    }),
    Phone({
      key: 'review-failed',
      name: 'Review · hold failed',
      route: ROUTE,
      note: 'The hold was refused, here because another squad took the seats in the meantime. The reason shows above the buttons until the next try.',
      header: HEADER,
      // catch (error) { setNotice(bookingErrorMessage(error)) } with the repository's not_enough_seats.
      content: review({
        notice: bookingErrorMessage(new BookingError('not_enough_seats')),
        holding: false,
      }),
    }),
    Phone({
      key: 'review-loading',
      name: 'Review · loading',
      route: ROUTE,
      note: 'The cafe is not in the cache yet (a deep link, or the app was restored on this screen): one placeholder block until it loads.',
      header: HEADER,
      content: Screen({ scroll: true }, Skeleton({ height: 220, radius: radii.lg })),
    }),
    Phone({
      key: 'review-error',
      name: 'Review · could not load',
      route: ROUTE,
      note: 'Loading the cafe failed. "Try again" refetches it, which brings the placeholder back.',
      header: HEADER,
      // onRetry is cafe.refetch(): with no data yet the query goes back to pending, and the route
      // checks cafe.isPending before cafe.isError, so the skeleton shows again.
      content: Screen({}, ErrorState({ retry: { go: 'review-loading', goHow: 'replace' } })),
    }),
    Phone({
      key: 'review-not-listed',
      name: 'Review · tier not listed',
      route: ROUTE,
      note: 'The cafe is gone or no longer has this station tier (an old link, or the cafe changed its tiers).',
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
    Phone({
      key: 'review-invalid',
      name: 'Review · nothing to review',
      route: ROUTE,
      note: 'The link is missing or has a malformed tier, cafe, start, duration or seat count; only a hand-made deep link gets here.',
      header: HEADER,
      content: Screen(
        {},
        EmptyState({
          title: 'Nothing to review',
          message: 'Pick a time first.',
          actionLabel: 'Back to Explore',
          action: BACK_TO_EXPLORE,
        }),
      ),
    }),
  ];
}
