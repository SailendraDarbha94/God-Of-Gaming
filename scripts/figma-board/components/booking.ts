/**
 * features/booking: StatusBadge, BookingCard, BookingSummary, DayPicker, DurationPicker, SeatStepper,
 * SlotGrid, SlotGridSkeleton, and the Alert.alert that confirmCancel.ts raises.
 *
 * Links follow the callbacks' names: onPress → `press`, onCancel → `cancel`, and each onChange →
 * `change`, a function from the value the handler would receive to the link for that control.
 */
import {
  BOOKING_CANCEL_LABELS,
  BOOKING_STATUS_LABELS,
  CANCEL_CONFIRMATION,
} from '@app/features/booking/copy';
import { effectiveStatus, isCancellable } from '@app/features/booking/history';
import { durationOptions, type DayOption, type SlotOption } from '@app/features/booking/slots';
import {
  formatDuration,
  formatRatePerHour,
  formatSeats,
  formatSession,
  formatStations,
} from '@app/lib/format';
import { DEVICE, ScrollView, SystemAlert } from '@board/chrome';
import { Skeleton } from '@board/components/shared';
import { box, colors, radii, row, spacing, touchTarget, type Frame } from '@board/dsl';
import { Button, Card, Chip, Text, type Link, type TextTone } from '@board/ui';
import {
  BOOKING_RULES,
  STATION_KIND_LABELS,
  formatIstDate,
  formatIstTime,
  formatPaise,
  instantToIst,
  type Booking,
  type BookingStatus,
  type IsoInstant,
  type LocalDate,
  type Minutes,
  type Paise,
  type StationKind,
} from '@gog/domain';

// ----- StatusBadge.tsx -----

export interface StatusBadgeProps {
  status: BookingStatus;
}

const TONES: Readonly<Record<BookingStatus, TextTone>> = {
  held: 'accent',
  confirmed: 'success',
  cancelled: 'muted',
  expired: 'danger',
  completed: 'muted',
  no_show: 'danger',
};

export function StatusBadge({ status }: StatusBadgeProps): Frame {
  return box(
    {
      name: `StatusBadge/${status}`,
      self: 'start',
      pad: [spacing.xs, spacing.sm],
      radius: radii.pill,
      fill: colors.surfaceRaised,
    },
    Text(BOOKING_STATUS_LABELS[status].toUpperCase(), { variant: 'label', tone: TONES[status] }),
  );
}

// ----- BookingCard.tsx -----

export interface BookingCardProps {
  booking: Booking;
  /** The instant the list was split at, so badge and actions agree with the sections. */
  now: IsoInstant;
  /** onPress: where tapping the card leads. */
  press?: Link;
  /** onCancel: the cancel button shows only when this is set (pass {} for no link) and the session is still cancellable. */
  cancel?: Link;
  cancelling?: boolean;
}

export function BookingCard({
  booking,
  now,
  press,
  cancel,
  cancelling = false,
}: BookingCardProps): Frame {
  const status = effectiveStatus(booking, now);
  const cancellable = cancel !== undefined && isCancellable(booking, now);

  // The Pressable has no style of its own (only the pressed opacity), so the card carries the link.
  return Card(
    { name: 'BookingCard', gap: spacing.xs, ...press },
    row(
      { name: 'header', justify: 'between', align: 'center', gap: spacing.sm },
      Text(booking.cafe.name, { variant: 'subheading', grow: true }),
      StatusBadge({ status }),
    ),
    Text(booking.tier.name, { tone: 'muted' }),
    Text(formatSession(booking.startsAt, booking.endsAt)),
    Text(formatSeats(booking.seatCount), { variant: 'caption', tone: 'muted' }),
    cancellable && (status === 'held' || status === 'confirmed')
      ? Button({
          label: BOOKING_CANCEL_LABELS[status],
          variant: 'ghost',
          loading: cancelling,
          style: { self: 'end', mt: spacing.xs },
          // A loading Button is disabled, so it leads nowhere.
          ...(cancelling ? {} : cancel),
        })
      : null,
  );
}

// ----- BookingSummary.tsx -----

export interface BookingSummaryProps {
  cafeName: string;
  tierName: string;
  kind: StationKind;
  startsAt: IsoInstant;
  endsAt: IsoInstant;
  seatCount: number;
  hourlyRatePaise: Paise;
  totalPaise: Paise;
  /** Station labels once seats are allocated; absent on the review step. */
  seatLabels?: string[];
}

/** The facts of a booking, shared by the review step and the hold screen. */
export function BookingSummary({
  cafeName,
  tierName,
  kind,
  startsAt,
  endsAt,
  seatCount,
  hourlyRatePaise,
  totalPaise,
  seatLabels,
}: BookingSummaryProps): Frame {
  return Card(
    { name: 'BookingSummary', gap: spacing.sm },
    Row({ label: 'Cafe', value: cafeName }),
    Row({ label: 'Station', value: `${tierName} · ${STATION_KIND_LABELS[kind]}` }),
    Row({ label: 'When', value: formatSession(startsAt, endsAt) }),
    Row({ label: 'Seats', value: formatSeats(seatCount) }),
    seatLabels === undefined || seatLabels.length === 0
      ? null
      : Row({ label: 'Assigned', value: seatLabels.join(', ') }),
    Row({ label: 'Rate', value: `${formatRatePerHour(hourlyRatePaise)} per seat` }),
    row(
      { name: 'total', justify: 'between', align: 'baseline', mt: spacing.sm },
      Text('Total', { variant: 'subheading' }),
      Text(formatPaise(totalPaise), { variant: 'heading', tone: 'accent' }),
    ),
  );
}

function Row({ label, value }: { label: string; value: string }): Frame {
  return row(
    { name: `Row/${label}`, gap: spacing.md },
    Text(label, { tone: 'muted', w: 80 }),
    Text(value, { grow: true }),
  );
}

// ----- DayPicker.tsx -----

export interface DayPickerProps {
  options: DayOption[];
  value: LocalDate | null;
  /** onChange: the link for the chip of each day, if choosing it leads to a state on the board. */
  change?: (day: LocalDate) => Link | undefined;
}

export function DayPicker({ options, value, change }: DayPickerProps): Frame {
  return ScrollView(
    { horizontal: true, style: { name: 'DayPicker' }, content: { name: 'row', gap: spacing.sm } },
    options.map((option) =>
      Chip({ label: option.label, selected: option.day === value, ...change?.(option.day) }),
    ),
  );
}

// ----- DurationPicker.tsx -----

export interface DurationPickerProps {
  value: Minutes;
  /** onChange: the link for the chip of each duration, if choosing it leads to a state on the board. */
  change?: (minutes: Minutes) => Link | undefined;
}

const OPTIONS = durationOptions();

export function DurationPicker({ value, change }: DurationPickerProps): Frame {
  return ScrollView(
    {
      horizontal: true,
      style: { name: 'DurationPicker' },
      content: { name: 'row', gap: spacing.sm },
    },
    OPTIONS.map((minutes) =>
      Chip({ label: formatDuration(minutes), selected: minutes === value, ...change?.(minutes) }),
    ),
  );
}

// ----- SeatStepper.tsx -----

export interface SeatStepperProps {
  value: number;
  /** The upper bound for this tier: the booking rule or the tier's station count, whichever is lower. */
  max: number;
  /** onChange: the link for the count a step button would set (value - 1 or value + 1). A disabled button gets none. */
  change?: (seats: number) => Link | undefined;
}

/** Squad size, 1 to 10 (spec 02 §Constants), never more than the tier has stations. */
export function SeatStepper({ value, max, change }: SeatStepperProps): Frame {
  const canDecrement = value > BOOKING_RULES.minSeats;
  const canIncrement = value < max;
  const cappedByTier = max < BOOKING_RULES.maxSeats && value >= max;

  return box(
    { name: 'SeatStepper', align: 'start', gap: spacing.xs },
    row(
      {
        name: 'stepper',
        align: 'center',
        radius: radii.md,
        stroke: colors.border,
        strokeW: 1,
        fill: colors.surfaceRaised,
      },
      StepButton({ label: '−', disabled: !canDecrement, press: change?.(value - 1) }),
      // styles.value is minWidth: 88; a text has no minimum here, and "10 seats" at 17 pt is narrower than 88.
      Text(formatSeats(value), { variant: 'subheading', w: 88, align: 'center' }),
      StepButton({ label: '+', disabled: !canIncrement, press: change?.(value + 1) }),
    ),
    cappedByTier
      ? Text(`This tier has ${formatStations(max)}.`, { variant: 'caption', tone: 'muted' })
      : null,
  );
}

function StepButton({
  label,
  disabled,
  press,
}: {
  label: string;
  disabled: boolean;
  press?: Link;
}): Frame {
  return box(
    {
      name: `StepButton/${label}${disabled ? ' (disabled)' : ''}`,
      w: touchTarget + 4,
      h: touchTarget + 4,
      align: 'center',
      justify: 'center',
      ...(disabled ? { opacity: 0.35 } : press),
    },
    Text(label, { variant: 'heading' }),
  );
}

// ----- SlotGrid.tsx and SlotGridSkeleton.tsx -----

/** Where both grids sit: Pick a time's padded Screen, inside a Section, neither of which narrows them further. */
export const SLOT_GRID_WIDTH = DEVICE.w - 2 * spacing.lg;

/**
 * styles.cell is `width: '31%'` with `flexGrow: 1` in a wrapping row with a gap. Yoga breaks lines on
 * the 31% basis (three fit, a fourth does not), then grows the cells of each line to share that
 * line's spare width, so a last line of one or two cells is stretched across the whole row.
 */
function cellWidths(count: number, container: number): number[] {
  const basis = container * 0.31;
  const perLine = Math.max(1, Math.floor((container + spacing.sm) / (basis + spacing.sm)));
  return Array.from({ length: count }, (_, index) => {
    const line = Math.floor(index / perLine);
    const inLine = Math.min(perLine, count - line * perLine);
    // Rounded down so three cells and two gaps never exceed the row by a rounding error.
    return Math.floor(((container - spacing.sm * (inLine - 1)) / inLine) * 100) / 100;
  });
}

export interface SlotGridProps {
  /** The opening day being shown; slots after midnight carry the next calendar date. */
  day: LocalDate;
  slots: SlotOption[];
  value: IsoInstant | null;
  /** onChange: the link for the cell of each start, if choosing it leads to a state on the board. A disabled cell gets none. */
  change?: (startsAt: IsoInstant) => Link | undefined;
}

/** `width` is the grid's own width, which the 31% cells are worked out against. */
export function SlotGrid(
  { day, slots, value, change }: SlotGridProps,
  width: number = SLOT_GRID_WIDTH,
): Frame {
  const widths = cellWidths(slots.length, width);
  return row(
    { name: 'SlotGrid', wrap: true, gap: spacing.sm },
    slots.map((slot, index) => {
      const selected = slot.startsAt === value;
      const crossesMidnight = instantToIst(slot.startsAt).day !== day;
      // Both the next date (spec 06) and the free count: a late-night squad needs the number too.
      const detail = [
        crossesMidnight ? formatIstDate(slot.startsAt) : null,
        `${slot.freeSeats} free`,
      ]
        .filter((part) => part !== null)
        .join(' · ');
      return box(
        {
          name: `cell${selected ? ' (selected)' : ''}${slot.selectable ? '' : ' (disabled)'}`,
          w: widths[index] ?? width,
          pad: [spacing.md, spacing.sm],
          radius: radii.md,
          strokeW: 1,
          stroke: selected ? colors.accent : colors.border,
          fill: selected ? colors.accent : colors.surface,
          align: 'center',
          gap: spacing.xs,
          ...(slot.selectable ? change?.(slot.startsAt) : { opacity: 0.35 }),
        },
        Text(formatIstTime(slot.startsAt, { style: 'short' }), {
          variant: 'subheading',
          ...(selected ? { color: colors.onAccent } : {}),
        }),
        Text(detail, { variant: 'caption', color: selected ? colors.onAccent : colors.textMuted }),
      );
    }),
  );
}

export interface SlotGridSkeletonProps {
  /** How many cells to draw, normally the number of starts the domain predicts for the day. */
  count: number;
}

/** `width` is the grid's own width, which the 31% cells are worked out against. */
export function SlotGridSkeleton(
  { count }: SlotGridSkeletonProps,
  width: number = SLOT_GRID_WIDTH,
): Frame {
  const cells = Array.from({ length: Math.max(count, 3) }, (_, index) => index);
  const widths = cellWidths(cells.length, width);
  return row(
    { name: 'SlotGridSkeleton', wrap: true, gap: spacing.sm },
    cells.map((index) =>
      box({ name: 'cell', w: widths[index] ?? width }, Skeleton({ height: 64, radius: radii.md })),
    ),
  );
}

// ----- confirmCancel.ts -----

/**
 * The Alert.alert that confirmCancel() raises before a confirmed booking is cancelled (releasing a
 * hold asks nothing). `keep` is the cancel-style "Keep it" button, `cancel` the destructive one that
 * runs onConfirm. Put it in Phone's `overlay`.
 */
export function CancelConfirmation(links: { keep?: Link; cancel?: Link } = {}): Frame {
  return SystemAlert(CANCEL_CONFIRMATION.title, CANCEL_CONFIRMATION.message, [
    { label: CANCEL_CONFIRMATION.keep, style: 'cancel', ...links.keep },
    { label: BOOKING_CANCEL_LABELS.confirmed, style: 'destructive', ...links.cancel },
  ]);
}
