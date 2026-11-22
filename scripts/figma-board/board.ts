/** Where each screen sits on the canvas, and the arrows of the flow between them. */

export interface Placement {
  key: string;
  /** Pins the frame to a column of the grid (0 is the first), so it sits under the frame above it. */
  col?: number;
}

export interface Section {
  name: string;
  title: string;
  subtitle: string;
  /** Section background, heading colour and secondary text colour. */
  fill: string;
  ink: string;
  inkMuted: string;
  /** Rows of screens, left to right. */
  rows: (string | Placement)[][];
}

export interface Arrow {
  from: string;
  to: string;
  label: string;
  /** 'main' is the path the story follows; 'branch' is a side path, drawn dashed and grey. */
  kind?: 'main' | 'branch';
}

export const page = { name: 'Player app', background: '#1B1B22' };

const DARK = { fill: '#24242E', ink: '#F4F4F8', inkMuted: '#A6A6B7' } as const;

export const sections: Section[] = [
  {
    name: '1 · Browse, book, cancel',
    title: 'Browse, book, cancel',
    subtitle:
      'The main path, left to right: find a cafe, pick a station tier and a time, hold seats, confirm. Green arrows follow one player through Saturday evening; grey dashed arrows are side paths. Every tappable control on this path is linked: press Present (▶) to click through it.',
    ...DARK,
    rows: [
      [
        'explore',
        'cafe',
        'pick',
        'pick-chosen',
        'review',
        'booking-held',
        'booking-confirmed',
        'booking-cancel-confirm',
        'booking-cancelled',
      ],
      [
        { key: 'sign-in', col: 4 },
        { key: 'sign-in-code', col: 5 },
      ],
    ],
  },
  {
    name: '2 · Bookings tab',
    title: 'Bookings tab',
    subtitle:
      'The second tab: the player’s upcoming and past sessions, cancelling from a card, and the other states a booking’s own screen can be in.',
    ...DARK,
    rows: [
      [
        'bookings-signed-out',
        'bookings-empty',
        'bookings',
        'bookings-cancel-confirm',
        'bookings-cancelling',
        'bookings-cancel-failed',
      ],
      [
        'bookings-loading',
        'bookings-error',
        'booking-expired',
        'booking-held-lapsed',
        'booking-confirm-refused',
      ],
      [
        'booking-loading',
        'booking-error',
        'booking-not-found',
        'booking-invalid-id',
        'booking-signed-out',
      ],
    ],
  },
  {
    name: '3 · Profile and sign-in',
    title: 'Profile and sign-in',
    subtitle:
      'The third tab, and every state of the sign-in sheet. The sheet opens over whichever screen asked for it and closes back to it.',
    ...DARK,
    rows: [
      ['profile-signed-out', 'profile', 'profile-signing-out'],
      ['sign-in-empty', 'sign-in-invalid', 'sign-in-sending', 'sign-in-send-failed'],
      ['sign-in-code-empty', 'sign-in-code-pending', 'sign-in-code-wrong'],
    ],
  },
  {
    name: '4 · Every other state',
    title: 'Every other state',
    subtitle:
      'What Explore, a cafe, Pick a time and Review show while loading, when something fails, and when there is nothing to show. One row per route.',
    ...DARK,
    rows: [
      ['explore-filtered', 'explore-loading', 'explore-empty', 'explore-error'],
      ['cafe-loading', 'cafe-error', 'cafe-not-found', 'cafe-not-bookable'],
      ['pick-loading', 'pick-slots-loading', 'pick-no-fit', 'pick-no-slots', 'pick-no-days'],
      ['pick-slots-error', 'pick-error', 'pick-not-found', 'pick-bad-link'],
      [
        'review-holding',
        'review-failed',
        'review-loading',
        'review-error',
        'review-not-listed',
        'review-invalid',
      ],
      ['not-found'],
    ],
  },
  {
    name: '5 · Foundations',
    title: 'Foundations',
    subtitle: 'The design tokens and core components every screen is built from.',
    ...DARK,
    rows: [
      ['foundations-colors', 'foundations-type'],
      ['foundations-spacing', 'foundations-components'],
    ],
  },
];

export const arrows: Arrow[] = [
  // The story.
  { from: 'explore', to: 'cafe', label: 'Tap a cafe' },
  { from: 'cafe', to: 'pick', label: 'Book on a tier' },
  { from: 'pick', to: 'pick-chosen', label: 'Choose a day, a length, seats and a start' },
  { from: 'pick-chosen', to: 'review', label: 'Continue' },
  { from: 'review', to: 'booking-held', label: 'Hold seats' },
  { from: 'booking-held', to: 'booking-confirmed', label: 'Confirm' },
  // Signing in on the way.
  { from: 'review', to: 'sign-in', label: 'Hold seats while signed out', kind: 'branch' },
  { from: 'sign-in', to: 'sign-in-code', label: 'Send code', kind: 'branch' },
  {
    from: 'sign-in-code',
    to: 'booking-held',
    label: 'Verify: the sheet closes and the hold goes through',
    kind: 'branch',
  },
  // Cancelling.
  {
    from: 'booking-confirmed',
    to: 'booking-cancel-confirm',
    label: 'Cancel booking',
    kind: 'branch',
  },
  {
    from: 'booking-cancel-confirm',
    to: 'booking-cancelled',
    label: 'Cancel booking',
    kind: 'branch',
  },
  {
    from: 'booking-held',
    to: 'booking-cancelled',
    label: 'Release seats (no question asked)',
    kind: 'branch',
  },
  // Bookings tab.
  {
    from: 'bookings',
    to: 'bookings-cancel-confirm',
    label: 'Cancel booking on a card',
    kind: 'branch',
  },
  {
    from: 'bookings-cancel-confirm',
    to: 'bookings-cancelling',
    label: 'Cancel booking',
    kind: 'branch',
  },
  {
    from: 'booking-held-lapsed',
    to: 'booking-confirm-refused',
    label: 'Confirm, too late',
    kind: 'branch',
  },
  // Profile and sign-in.
  {
    from: 'profile-signed-out',
    to: 'profile',
    label: 'Sign in, through the sheet',
    kind: 'branch',
  },
  { from: 'profile', to: 'profile-signing-out', label: 'Sign out', kind: 'branch' },
  {
    from: 'profile-signing-out',
    to: 'profile-signed-out',
    label: 'The session ends',
    kind: 'branch',
  },
  {
    from: 'sign-in-empty',
    to: 'sign-in-invalid',
    label: 'Send code without a valid number',
    kind: 'branch',
  },
  { from: 'sign-in-sending', to: 'sign-in-send-failed', label: 'The send fails', kind: 'branch' },
  {
    from: 'sign-in-code-pending',
    to: 'sign-in-code-wrong',
    label: 'The code is wrong',
    kind: 'branch',
  },
];

export const flowStart = { key: 'explore', name: 'Player app' };
