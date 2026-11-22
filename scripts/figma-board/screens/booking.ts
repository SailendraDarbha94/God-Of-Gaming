/** app/booking/[id].tsx */
import {
  BOOKING_CANCEL_LABELS,
  BOOKING_ERROR_COPY,
  rateChangedNotice,
} from '@app/features/booking/copy';
import { effectiveStatus, hasLapsed } from '@app/features/booking/history';
import { DEVICE, Phone, Screen, type HeaderProps } from '@board/chrome';
import { BookingSummary, CancelConfirmation, StatusBadge } from '@board/components/booking';
import { Countdown, EmptyState, ErrorState, Notice, Skeleton } from '@board/components/shared';
import { box, radii, spacing, type Frame, type Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';
import { Button, Card, Text, type Link } from '@board/ui';
import { canTransition, type Booking, type IsoInstant, type Paise } from '@gog/domain';

const ROUTE = 'app/booking/[id].tsx';

/** app/_layout.tsx: <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} /> */
const TITLE = 'Booking';

/** What a percentage width inside the padded Screen is worked out against. */
const CONTENT_W = DEVICE.w - 2 * spacing.lg;

const BOOKINGS: Link = { go: 'bookings', goHow: 'replace' }; // goToBookings: router.replace('/bookings')

interface BookingViewProps {
  booking: Booking;
  /** nowIso() at render. */
  now: IsoInstant;
  /** The `quoted` route parameter: the total the review step showed, when it differs from the hold's. */
  quoted?: Paise;
  /** useState `notice`: the message of a failed confirm or cancel. */
  notice?: string | null;
  /** confirm.isPending / cancel.isPending */
  confirming?: boolean;
  cancelling?: boolean;
  /** onConfirm, onCancel and goToBookings as prototype links. */
  confirm?: Link;
  cancel?: Link;
  bookings?: Link;
}

/** The route's last return: everything it renders once the booking is loaded (lines 105 to 232). */
function BookingView({
  booking,
  now,
  quoted,
  notice = null,
  confirming = false,
  cancelling = false,
  confirm,
  cancel,
  bookings,
}: BookingViewProps): Frame {
  const lapsed = hasLapsed(booking, now);
  const status = effectiveStatus(booking, now);
  const busy = confirming || cancelling;
  const canConfirm = canTransition(booking.status, 'confirmed');
  const canCancel = canTransition(booking.status, 'cancelled');
  const rateNotice =
    quoted !== undefined && quoted !== booking.totalPaise
      ? rateChangedNotice(quoted, booking)
      : null;

  return Screen(
    { scroll: true },
    StatusBadge({ status }),
    Text(booking.cafe.name, { variant: 'title', mt: spacing.sm, mb: spacing.lg }),

    booking.status === 'held' && !lapsed && booking.holdExpiresAt !== null
      ? Card(
          { name: 'Card (countdown)', align: 'center', gap: spacing.xs, mb: spacing.lg },
          Text('Seats held for', { tone: 'muted' }),
          Countdown({ until: booking.holdExpiresAt, now, variant: 'title', tone: 'accent' }),
          Text('Confirm before the timer runs out or the seats go back on sale.', {
            variant: 'caption',
            tone: 'muted',
          }),
        )
      : null,

    booking.status === 'held' && lapsed
      ? box(
          { name: 'message', mb: spacing.lg },
          Notice({
            message:
              'The timer has run out. Confirm now in case the seats are still yours, or pick a time again.',
          }),
        )
      : null,

    rateNotice === null
      ? null
      : box({ name: 'message', mb: spacing.lg }, Notice({ message: rateNotice })),

    booking.status === 'confirmed'
      ? box(
          { name: 'message', mb: spacing.lg },
          Notice({
            tone: 'success',
            message: 'You are booked. Show this screen at the counter and pay there.',
          }),
        )
      : null,

    booking.status === 'expired'
      ? box(
          { name: 'message', mb: spacing.lg },
          Notice({
            tone: 'error',
            message: 'This hold expired before it was confirmed. Pick a time again.',
          }),
        )
      : null,

    BookingSummary({
      cafeName: booking.cafe.name,
      tierName: booking.tier.name,
      kind: booking.tier.kind,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      seatCount: booking.seatCount,
      hourlyRatePaise: booking.hourlyRatePaise,
      totalPaise: booking.totalPaise,
      seatLabels: booking.seats
        .filter((seat) => seat.releasedAt === null)
        .map((seat) => seat.stationLabel),
    }),

    notice === null
      ? null
      : box({ name: 'message', mb: spacing.lg }, Notice({ tone: 'error', message: notice })),

    box(
      { name: 'actions', mt: spacing.xl, gap: spacing.sm },
      canConfirm
        ? Button({
            label: 'Confirm',
            loading: confirming,
            disabled: busy,
            block: true,
            // A disabled Button leads nowhere.
            ...(busy ? {} : confirm),
          })
        : Button({ label: 'My bookings', variant: 'secondary', block: true, ...bookings }),
      canCancel && (booking.status === 'held' || booking.status === 'confirmed')
        ? Button({
            label: BOOKING_CANCEL_LABELS[booking.status],
            variant: 'ghost',
            loading: cancelling,
            disabled: busy,
            block: true,
            ...(busy ? {} : cancel),
          })
        : null,
    ),
  );
}

export function screens(s: Scenario): BoardScreen[] {
  if (s.held.holdExpiresAt === null) {
    throw new Error('booking: the story hold has no expiry');
  }
  /** The instant the story hold's timer reaches 0:00 (hasLapsed compares with <=). */
  const lapsedNow: IsoInstant = s.held.holdExpiresAt;
  /** What markHoldLapsed (queries.ts) leaves in the cache after confirm_booking answers invalid_state. */
  const refused: Booking = { ...s.held, status: 'expired' };

  // review.tsx replaces itself with this route, so the stack under a fresh hold ends at Pick a time.
  const fromReview: HeaderProps = { title: TITLE, back: 'pick-chosen' };
  // bookings.tsx pushes this route from a card.
  const fromList: HeaderProps = { title: TITLE, back: 'bookings' };
  const plain: HeaderProps = { title: TITLE, back: true };

  return [
    // ----- The story -----
    Phone({
      key: 'booking-held',
      name: 'Booking · on hold',
      route: ROUTE,
      note: 'Right after "Hold seats" on Review: four seats at Pixel Den are held and the ten-minute timer is running. Confirm keeps them; Release seats lets them go at once, with no question asked.',
      header: fromReview,
      content: BookingView({
        booking: s.held,
        now: s.heldNow,
        confirm: { go: 'booking-confirmed', goHow: 'replace' },
        // confirmCancel() runs the cancel straight away for a hold; the screen stays and reads Cancelled.
        cancel: { go: 'booking-cancelled', goHow: 'replace' },
        bookings: BOOKINGS,
      }),
    }),
    Phone({
      key: 'booking-confirmed',
      name: 'Booking · confirmed',
      route: ROUTE,
      note: 'The same booking after Confirm. The player shows this at the counter and pays there. Also where a confirmed card in My bookings opens.',
      header: fromReview,
      content: BookingView({
        booking: s.confirmed,
        now: s.now,
        cancel: { go: 'booking-cancel-confirm', goHow: 'replace' },
        bookings: BOOKINGS,
      }),
    }),
    Phone({
      key: 'booking-cancel-confirm',
      name: 'Booking · cancel?',
      route: ROUTE,
      note: 'Cancelling a confirmed booking asks first, with a system alert. "Keep it" closes the alert; "Cancel booking" cancels and the screen reads Cancelled.',
      header: fromReview,
      // The alert covers the screen, so nothing under it carries a link.
      content: BookingView({ booking: s.confirmed, now: s.now }),
      overlay: [
        CancelConfirmation({
          keep: { go: 'booking-confirmed', goHow: 'replace' },
          cancel: { go: 'booking-cancelled', goHow: 'replace' },
        }),
      ],
    }),
    Phone({
      key: 'booking-cancelled',
      name: 'Booking · cancelled',
      route: ROUTE,
      note: 'A booking the player cancelled: here, the sim rig hold at Frame Rate they released on Friday, opened from My bookings. Nothing is left to do but go back to the list.',
      header: fromList,
      content: BookingView({ booking: s.cancelled, now: s.bookingsNow, bookings: BOOKINGS }),
    }),
    Phone({
      key: 'booking-expired',
      name: 'Booking · hold expired',
      route: ROUTE,
      note: 'A hold that ran out before it was confirmed: the Clutch Arena hold from Saturday morning, opened from My bookings.',
      header: fromList,
      content: BookingView({ booking: s.expired, now: s.bookingsNow, bookings: BOOKINGS }),
    }),

    // ----- Other states of a loaded booking -----
    Phone({
      key: 'booking-held-lapsed',
      name: 'Booking · timer ran out',
      route: ROUTE,
      note: 'The story hold if the player had let the ten minutes pass while the server still lists it as held. The badge reads Hold expired, yet Confirm and Release seats are still offered: the server decides.',
      header: fromReview,
      content: BookingView({
        booking: s.held,
        now: lapsedNow,
        // confirm_booking is the verdict: it either confirms, or answers invalid_state (drawn next).
        confirm: { go: 'booking-confirm-refused', goHow: 'replace' },
        cancel: { go: 'booking-cancelled', goHow: 'replace' },
        bookings: BOOKINGS,
      }),
    }),
    Phone({
      key: 'booking-confirm-refused',
      name: 'Booking · confirm refused',
      route: ROUTE,
      note: 'Confirm was tapped after the timer ran out and the server said no. The hold now reads expired and the reason shows under the summary. Any failed confirm or cancel puts its message in that place.',
      header: fromReview,
      content: BookingView({
        booking: refused,
        now: lapsedNow,
        notice: BOOKING_ERROR_COPY.invalid_state,
        bookings: BOOKINGS,
      }),
    }),

    // ----- Before there is a booking to show, in the order the route checks -----
    Phone({
      key: 'booking-invalid-id',
      name: 'Booking · bad link',
      route: ROUTE,
      note: 'The id in the link is not a valid booking id (a broken deep link).',
      header: plain,
      content: Screen(
        {},
        EmptyState({ title: 'No such booking', actionLabel: 'My bookings', action: BOOKINGS }),
      ),
    }),
    Phone({
      key: 'booking-signed-out',
      name: 'Booking · signed out',
      route: ROUTE,
      note: 'Nobody is signed in, for example after signing out with a booking link still open. Sign in raises the sign-in sheet.',
      header: plain,
      content: Screen(
        {},
        EmptyState({
          title: 'Sign in to see this booking',
          actionLabel: 'Sign in',
          action: { go: 'sign-in', goHow: 'modal' },
        }),
      ),
    }),
    Phone({
      key: 'booking-loading',
      name: 'Booking · loading',
      route: ROUTE,
      note: "While the session is restored or the player's bookings are loading for the first time.",
      header: plain,
      content: Screen(
        { scroll: true },
        box(
          { name: 'skeletons', gap: spacing.md },
          Skeleton({ width: CONTENT_W * 0.4, height: 20, radius: radii.pill }),
          Skeleton({ width: CONTENT_W * 0.7, height: 28 }),
          Skeleton({ height: 200, radius: radii.lg }),
        ),
      ),
    }),
    Phone({
      key: 'booking-error',
      name: 'Booking · could not load',
      route: ROUTE,
      note: 'The bookings request failed. Try again repeats it and the screen stays as it is until an answer arrives.',
      header: plain,
      // onRetry refetches; it navigates nowhere.
      content: Screen({}, ErrorState({ title: 'Could not load this booking', retry: {} })),
    }),
    Phone({
      key: 'booking-not-found',
      name: 'Booking · not found',
      route: ROUTE,
      note: "The id is well formed but is not among the signed-in player's bookings.",
      header: plain,
      content: Screen(
        {},
        EmptyState({
          title: 'We could not find that booking',
          message: 'It may belong to another account.',
          actionLabel: 'My bookings',
          action: BOOKINGS,
        }),
      ),
    }),
  ];
}
