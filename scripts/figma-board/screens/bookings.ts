/** app/(tabs)/bookings.tsx */
import { bookingErrorMessage } from '@app/features/booking/copy';
import { splitBookings } from '@app/features/booking/history';
import { Phone, Screen, ScrollView } from '@board/chrome';
import { BookingCard, CancelConfirmation } from '@board/components/booking';
import { EmptyState, ErrorState, Notice, Skeleton } from '@board/components/shared';
import { box, radii, spacing, type Frame, type Node, type Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';
import { Text, type Link } from '@board/ui';
import type { Booking, IsoInstant, Uuid } from '@gog/domain';

const ROUTE = 'app/(tabs)/bookings.tsx';

/** Tabs.Screen name="bookings" options={{ title: 'Bookings' }}: the tab's own header, no back button. */
const HEADER = { title: 'Bookings' } as const;

/** function Gap(): styles.gap */
function Gap(): Frame {
  return box({ name: 'Gap', h: spacing.sm });
}

interface BookingsListProps {
  /** bookings.data */
  bookings: Booking[];
  /** useNow() */
  now: IsoInstant;
  /** The `notice` state: the message of the last failed cancel. */
  notice?: string | null;
  /** cancel.variables while cancel.isPending: the booking whose button spins. */
  cancellingId?: Uuid | null;
  /** onPress of a card: router.push('/booking/[id]'). The link for that booking's detail, where the board has one. */
  press?: (booking: Booking) => Link | undefined;
  /** onCancel of a card: what cancelBooking(item) leads to. The button shows either way. */
  cancel?: (booking: Booking) => Link | undefined;
  /** ListEmptyComponent's onAction. */
  explore?: Link;
}

/**
 * The signed-in, loaded branch: <Screen padded={false}> around the SectionList.
 *
 * React Native's SectionList puts every section header, item and section footer in a cell view of
 * its own, all direct children of the content container (styles.list), so the container's `gap`
 * applies between cells. Inside an item's cell, SectionSeparatorComponent sits above the first item
 * and below the last item of a section, ItemSeparatorComponent below every other item. The route
 * has no renderSectionFooter, so each section ends in an empty cell that still takes a `gap`.
 */
function BookingsList({
  bookings,
  now,
  notice = null,
  cancellingId = null,
  press,
  cancel,
  explore,
}: BookingsListProps): Frame {
  const { upcoming, past } = splitBookings(bookings, now);
  const sections = [
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past },
  ].filter((section) => section.data.length > 0);

  return Screen(
    { padded: false },
    ScrollView(
      {
        // styles.list
        content: { pad: [spacing.lg, spacing.lg, spacing.xxl, spacing.lg], gap: spacing.sm },
      },
      notice === null
        ? null
        : box({ name: 'ListHeaderComponent' }, Notice({ tone: 'error', message: notice })),
      sections.length === 0
        ? EmptyState({
            title: 'No bookings yet',
            message: 'Find a cafe in Explore and hold seats for your squad.',
            actionLabel: 'Explore cafes',
            action: explore ?? {},
          })
        : null,
      sections.map((section) => [
        box(
          { name: 'cell (section header)' },
          // styles.sectionTitle
          Text(section.title.toUpperCase(), { variant: 'label', tone: 'muted', mb: spacing.xs }),
        ),
        section.data.map((item, index) =>
          box(
            { name: 'cell (item)' },
            index === 0 ? Gap() : null,
            BookingCard({
              booking: item,
              now,
              press: press?.(item),
              cancel: cancel?.(item) ?? {},
              cancelling: cancellingId === item.id,
            }),
            // The last item of a section gets SectionSeparatorComponent, the others ItemSeparatorComponent; both are Gap.
            Gap(),
          ),
        ),
        box({ name: 'cell (section footer, empty)', h: 0 }),
      ]),
    ),
  );
}

/** A layer and everything in it, with no prototype links. */
function withoutLinks(node: Node): Node {
  const { go: _go, goHow: _goHow, back: _back, ...rest } = node;
  return rest.t === 'frame' && rest.children !== undefined
    ? { ...rest, children: rest.children.map(withoutLinks) }
    : rest;
}

/**
 * Alert.alert (confirmCancel.ts) is modal: while it is up nothing behind it takes a touch, the tab
 * bar included. Phone() always links the unfocused tabs, so every link outside the alert comes off
 * here.
 */
function underAlert(screen: BoardScreen, alert: Frame): BoardScreen {
  return {
    ...screen,
    tree: {
      ...screen.tree,
      children: (screen.tree.children ?? []).map((child) =>
        child === alert ? child : withoutLinks(child),
      ),
    },
  };
}

export function screens(s: Scenario): BoardScreen[] {
  // confirmCancel(): "Keep it" only closes the alert; "Cancel booking" runs onConfirm, the mutation.
  const cancelAlert = CancelConfirmation({
    keep: { go: 'bookings', goHow: 'replace' },
    cancel: { go: 'bookings-cancelling', goHow: 'replace' },
  });

  // router.push({ pathname: '/booking/[id]', params: { id: item.id } }): the same for every card.
  // The board draws the detail of three of these five bookings, so only those cards lead somewhere.
  const press = (booking: Booking): Link | undefined => {
    if (booking.id === s.confirmed.id) {
      return { go: 'booking-confirmed', goHow: 'push' };
    }
    if (booking.id === s.cancelled.id) {
      return { go: 'booking-cancelled', goHow: 'push' };
    }
    if (booking.id === s.expired.id) {
      return { go: 'booking-expired', goHow: 'push' };
    }
    return undefined;
  };
  // cancelBooking(item) → confirmCancel(): a confirmed booking raises the alert; a hold is released
  // at once, a state this file does not draw for s.otherHold.
  const cancel = (booking: Booking): Link | undefined =>
    booking.id === s.confirmed.id ? { go: 'bookings-cancel-confirm', goHow: 'replace' } : undefined;

  return [
    Phone({
      key: 'bookings',
      name: 'Bookings',
      route: ROUTE,
      note: "The second tab while signed in, at the end of the story: tonight's hold and the confirmed Sunday session under Upcoming, the three finished ones under Past. A card opens its booking.",
      mode: 'full',
      header: HEADER,
      tabs: { active: 'bookings' },
      content: BookingsList({ bookings: s.bookings, now: s.bookingsNow, press, cancel }),
    }),
    Phone({
      key: 'bookings-signed-out',
      name: 'Bookings · signed out',
      route: ROUTE,
      note: 'The second tab with no session. "Sign in" opens the sign-in sheet.',
      header: HEADER,
      // With no session the Profile tab shows its own signed-out state.
      tabs: { active: 'bookings', targets: { profile: 'profile-signed-out' } },
      content: Screen(
        {},
        EmptyState({
          title: 'Sign in to see your bookings',
          message: 'Your holds and confirmed sessions show up here.',
          actionLabel: 'Sign in',
          action: { go: 'sign-in', goHow: 'modal' },
        }),
      ),
    }),
    Phone({
      key: 'bookings-empty',
      name: 'Bookings · empty',
      route: ROUTE,
      note: 'Signed in, and the player has never held a seat. "Explore cafes" switches to the Explore tab.',
      header: HEADER,
      tabs: { active: 'bookings' },
      content: BookingsList({
        bookings: [],
        now: s.bookingsNow,
        // router.replace('/')
        explore: { go: 'explore', goHow: 'replace' },
      }),
    }),
    Phone({
      key: 'bookings-loading',
      name: 'Bookings · loading',
      route: ROUTE,
      note: 'While the saved session is read at launch, or while the first request for the bookings is out.',
      header: HEADER,
      tabs: { active: 'bookings' },
      content: Screen(
        {},
        box(
          { name: 'skeletons', gap: spacing.md },
          Skeleton({ height: 120, radius: radii.lg }),
          Skeleton({ height: 120, radius: radii.lg }),
        ),
      ),
    }),
    Phone({
      key: 'bookings-error',
      name: 'Bookings · could not load',
      route: ROUTE,
      note: 'The request for the bookings failed, after one automatic retry. "Try again" refetches, which brings the skeletons back.',
      header: HEADER,
      tabs: { active: 'bookings' },
      content: Screen(
        {},
        ErrorState({
          title: 'Could not load your bookings',
          retry: { go: 'bookings-loading', goHow: 'replace' },
        }),
      ),
    }),
    underAlert(
      Phone({
        key: 'bookings-cancel-confirm',
        name: 'Bookings · cancel a confirmed booking?',
        route: ROUTE,
        note: 'After "Cancel booking" on the confirmed card: the system asks first. Releasing a hold ("Release seats") asks nothing.',
        header: HEADER,
        tabs: { active: 'bookings' },
        // The alert takes every touch, so neither the list under it nor the tab bar carries a link.
        content: BookingsList({ bookings: s.bookings, now: s.bookingsNow }),
        overlay: [cancelAlert],
      }),
      cancelAlert,
    ),
    Phone({
      key: 'bookings-cancelling',
      name: 'Bookings · cancelling',
      route: ROUTE,
      note: 'While the cancel request is out, the card\'s button spins. When it succeeds the booking moves to Past as "Cancelled".',
      header: HEADER,
      tabs: { active: 'bookings' },
      content: BookingsList({
        bookings: s.bookings,
        now: s.bookingsNow,
        cancellingId: s.confirmed.id,
        press,
      }),
    }),
    Phone({
      key: 'bookings-cancel-failed',
      name: 'Bookings · cancel failed',
      route: ROUTE,
      note: 'The cancel request failed (here: no connection), so nothing changed and a notice heads the list. It stays until the next cancel attempt.',
      header: HEADER,
      tabs: { active: 'bookings' },
      content: BookingsList({
        bookings: s.bookings,
        now: s.bookingsNow,
        // setNotice(bookingErrorMessage(error)) with an error that is not a BookingError.
        notice: bookingErrorMessage(new Error('Network request failed')),
        press,
        cancel,
      }),
    }),
  ];
}
