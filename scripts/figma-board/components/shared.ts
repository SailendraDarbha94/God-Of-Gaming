/**
 * The shared components of apps/player/src/components that ui.ts does not cover:
 * EmptyState, ErrorState, ListRow, Notice, Section, Skeleton and Countdown.
 */
import {
  box,
  colors,
  radii,
  row,
  spacing,
  touchTarget,
  type Child,
  type Frame,
  type TextNode,
} from '@board/dsl';
import { Button, Text, type Link, type TextProps } from '@board/ui';
import type { IsoInstant } from '@gog/domain';

/** StyleSheet.hairlineWidth on a 3x iPhone. */
export const HAIRLINE = 1 / 3;

// ----- EmptyState.tsx -----

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  /** onAction: where the button leads in the prototype. The button shows only when this and actionLabel are set. */
  action?: Link;
}

export function EmptyState({ title, message, actionLabel, action }: EmptyStateProps): Frame {
  return box(
    {
      name: 'EmptyState',
      align: 'center',
      pad: [spacing.xxl, spacing.xl],
      gap: spacing.sm,
    },
    Text(title, { variant: 'subheading', align: 'center' }),
    message === undefined ? null : Text(message, { tone: 'muted', align: 'center' }),
    // Button keeps its own alignSelf: 'flex-start', so it sits at the left edge under the centred text.
    actionLabel !== undefined && action !== undefined
      ? Button({ label: actionLabel, variant: 'secondary', style: { mt: spacing.md }, ...action })
      : null,
  );
}

// ----- ErrorState.tsx -----

export interface ErrorStateProps {
  title?: string;
  message?: string;
  /** onRetry: pass a link (or {}) to show "Try again". */
  retry?: Link;
}

/** A failed load. The calm default copy never shows raw error text to players. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'Check your connection and try again.',
  retry,
}: ErrorStateProps = {}): Frame {
  return EmptyState({
    title,
    message,
    ...(retry === undefined ? {} : { actionLabel: 'Try again', action: retry }),
  });
}

// ----- ListRow.tsx -----

export interface ListRowProps {
  label: string;
  value?: string;
  hint?: string;
  /** onPress: makes the row a link, and a chevron shows it leads somewhere. Pass {} for a link that leaves the app. */
  press?: Link;
}

export function ListRow({ label, value, hint, press }: ListRowProps): Frame {
  return row(
    {
      name: 'ListRow',
      align: 'center',
      gap: spacing.md,
      minH: touchTarget,
      pad: [spacing.sm, 0],
      stroke: colors.border,
      strokeW: { bottom: HAIRLINE },
      ...press,
    },
    box(
      { name: 'texts', grow: true, gap: 2 },
      Text(label),
      hint === undefined ? null : Text(hint, { variant: 'caption', tone: 'subtle' }),
    ),
    value === undefined ? null : Text(value, { tone: 'muted' }),
    press === undefined ? null : Text('›', { tone: 'subtle' }),
  );
}

// ----- Notice.tsx -----

export type NoticeTone = 'error' | 'info' | 'success';

const NOTICE_BORDER: Readonly<Record<NoticeTone, string>> = {
  error: colors.danger,
  info: colors.border,
  success: colors.success,
};

/** An inline message for the outcome of an action: a failed hold, an expired code, a saved change. */
export function Notice({ message, tone = 'info' }: { message: string; tone?: NoticeTone }): Frame {
  return box(
    {
      name: `Notice/${tone}`,
      pad: spacing.md,
      radius: radii.md,
      stroke: NOTICE_BORDER[tone],
      strokeW: 1,
      fill: colors.surface,
    },
    Text(message, {
      tone: tone === 'error' ? 'danger' : tone === 'success' ? 'success' : 'default',
    }),
  );
}

// ----- Section.tsx -----

/** A titled block of a detail screen. */
export function Section({ title }: { title: string }, ...children: Child[]): Frame {
  return box(
    { name: `Section/${title}`, gap: spacing.sm, mt: spacing.xl },
    Text(title.toUpperCase(), { variant: 'label', tone: 'muted' }),
    ...children,
  );
}

// ----- Skeleton.tsx -----

export interface SkeletonProps {
  /** A number of points, or 'fill' for the default '100%'. Work a percentage out against its container. */
  width?: number | 'fill';
  height?: number;
  radius?: number;
}

/** A pulsing placeholder block shown while a query is pending, caught mid-pulse (it runs 0.5 to 1). */
export function Skeleton({
  width = 'fill',
  height = 16,
  radius = radii.sm,
}: SkeletonProps = {}): Frame {
  return box({
    name: 'Skeleton',
    w: width,
    h: height,
    radius,
    fill: colors.surfaceRaised,
    opacity: 0.75,
  });
}

// ----- Countdown.tsx -----

export interface CountdownProps extends TextProps {
  until: IsoInstant;
  /** The moment the screen is drawn at (the app passes its clock). */
  now: IsoInstant;
}

/** "9:58" counting down to `until`. */
export function Countdown({ until, now, ...textProps }: CountdownProps): TextNode {
  const seconds = Math.max(0, Math.ceil((Date.parse(until) - Date.parse(now)) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return Text(`${minutes}:${rest.toString().padStart(2, '0')}`, textProps);
}
