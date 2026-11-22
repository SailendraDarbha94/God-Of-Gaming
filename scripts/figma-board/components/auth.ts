/** features/auth/PhoneForm.tsx and features/auth/OtpForm.tsx: the two steps of the sign-in sheet. */
import { INDIA_DIAL_CODE, normaliseIndianMobileInput } from '@app/features/auth/phone';
import { formatPhoneForDisplay } from '@app/lib/format';
import { Notice } from '@board/components/shared';
import { box, colors, radii, row, spacing, touchTarget, type Frame } from '@board/dsl';
import { Button, Text, type Link } from '@board/ui';

// ----- PhoneForm.tsx -----

export interface PhoneFormProps {
  pending: boolean;
  /** A failure from the gateway, already turned into copy. */
  error: string | null;
  /**
   * useState `input`: what the player has typed. It passes through the form's own normaliser, as
   * onChangeText does, so the field shows the ten local digits whatever is given here.
   */
  input?: string;
  /**
   * useState `invalid`: "Send code" was pressed on something that is not an Indian mobile number.
   * Any edit clears it, so the app only shows it next to the rejected input.
   */
  invalid?: boolean;
  /** onSubmit: where "Send code" leads. Dropped while `pending`, when the button is disabled. */
  submit?: Link;
}

export function PhoneForm({
  pending,
  error,
  input = '',
  invalid = false,
  submit,
}: PhoneFormProps): Frame {
  const value = normaliseIndianMobileInput(input);
  return box(
    { name: 'PhoneForm', gap: spacing.md },
    Text('Your mobile number', { variant: 'heading' }),
    Text('We send a one-time code by SMS. No password, nothing else stored.', { tone: 'muted' }),
    row(
      {
        name: 'field',
        align: 'center',
        gap: spacing.sm,
        minH: touchTarget + 8,
        pad: [0, spacing.md],
        radius: radii.md,
        stroke: colors.border,
        strokeW: 1,
        fill: colors.surface,
      },
      Text(INDIA_DIAL_CODE, { variant: 'subheading', tone: 'muted' }),
      // TextInput: styles.input carries the type step, so the placeholder is set in it too.
      box(
        { name: 'input', grow: true, pad: [spacing.sm, 0] },
        value === ''
          ? Text('98765 43210', { variant: 'subheading', color: colors.textSubtle })
          : Text(value, { variant: 'subheading', color: colors.text }),
      ),
    ),
    invalid ? Notice({ tone: 'error', message: 'Enter a 10-digit Indian mobile number.' }) : null,
    error === null ? null : Notice({ tone: 'error', message: error }),
    Button({ label: 'Send code', loading: pending, block: true, ...(pending ? {} : submit) }),
  );
}

// ----- OtpForm.tsx -----

export interface OtpFormProps {
  /** The number the code went to, in E.164 form, shown so a typo is easy to spot. */
  phone: string;
  pending: boolean;
  error: string | null;
  /**
   * useState `token`: the digits typed so far. Non-digits are dropped and it is cut at six, as
   * onChangeText does.
   */
  token?: string;
  /** onSubmit: where "Verify" leads. Dropped unless all six digits are in and nothing is pending. */
  submit?: Link;
  /** onResend: where "Resend code" leads. Dropped while `pending`. */
  resend?: Link;
  /** onChangeNumber: where "Change number" leads. Dropped while `pending`. */
  changeNumber?: Link;
}

/** OtpForm.tsx keeps this as a module constant and does not export it. */
const OTP_LENGTH = 6;

export function OtpForm({
  phone,
  pending,
  error,
  token = '',
  submit,
  resend,
  changeNumber,
}: OtpFormProps): Frame {
  const value = token.replace(/\D/g, '').slice(0, OTP_LENGTH);
  const complete = value.length === OTP_LENGTH;
  return box(
    { name: 'OtpForm', gap: spacing.md },
    Text('Enter the code', { variant: 'heading' }),
    Text(`Sent by SMS to ${formatPhoneForDisplay(phone.replace(/^\+/, ''))}.`, { tone: 'muted' }),
    // TextInput: the box is styles.input; a single-line input centres its text in its minHeight.
    box(
      {
        name: 'input',
        minH: touchTarget + 16,
        pad: [0, spacing.md],
        radius: radii.md,
        stroke: colors.border,
        strokeW: 1,
        fill: colors.surface,
        justify: 'center',
      },
      value === ''
        ? Text('123456', { variant: 'title', color: colors.textSubtle, ls: 8, align: 'center' })
        : Text(value, { variant: 'title', color: colors.text, ls: 8, align: 'center' }),
    ),
    error === null ? null : Notice({ tone: 'error', message: error }),
    Button({
      label: 'Verify',
      disabled: !complete,
      loading: pending,
      block: true,
      ...(complete && !pending ? submit : {}),
    }),
    row(
      { name: 'secondary', justify: 'between' },
      Button({
        label: 'Resend code',
        variant: 'ghost',
        disabled: pending,
        ...(pending ? {} : resend),
      }),
      Button({
        label: 'Change number',
        variant: 'ghost',
        disabled: pending,
        ...(pending ? {} : changeNumber),
      }),
    ),
  );
}
