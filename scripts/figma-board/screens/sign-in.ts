/** app/auth/sign-in.tsx */
import { authErrorMessage } from '@app/features/auth/copy';
import { toIndianMobileE164 } from '@app/features/auth/phone';
import { Phone, Screen } from '@board/chrome';
import { OtpForm, PhoneForm } from '@board/components/auth';
import { spacing, type Frame, type Screen as BoardScreen } from '@board/dsl';
import type { Scenario } from '@board/scenario';
import { Button, type Link } from '@board/ui';
import { DataError } from '@gog/data';

const ROUTE = 'app/auth/sign-in.tsx';

// setStep(): the sheet stays where it is and swaps its form, so every in-route link is a replace.
const TO_CODE: Link = { go: 'sign-in-code', goHow: 'replace' };
const TO_INVALID: Link = { go: 'sign-in-invalid', goHow: 'replace' };
/** onChangeNumber: PhoneForm mounts again, so its field is empty. */
const TO_EMPTY_PHONE: Link = { go: 'sign-in-empty', goHow: 'replace' };
/** verify(): router.back() once the code is accepted. */
const CLOSE: Link = { back: true };

interface SheetProps {
  key: string;
  name: string;
  note: string;
  /** useState `pending`: a send or a verify is in flight. */
  pending: boolean;
}

/**
 * The route's own render: <Screen scroll> around the step's form and "Not now". The
 * KeyboardAvoidingView between them draws nothing. Both forms autoFocus their input and Screen
 * keeps the keyboard up through taps (keyboardShouldPersistTaps), so the pad is raised in every state.
 */
function Sheet({ key, name, note, pending }: SheetProps, form: Frame): BoardScreen {
  return Phone({
    key,
    name,
    route: ROUTE,
    note,
    modal: true,
    header: { title: 'Sign in' },
    // PhoneForm asks for keyboardType="phone-pad" (PhoneForm.tsx:50), OtpForm for "number-pad" (OtpForm.tsx:49).
    keyboard: key.startsWith('sign-in-code') ? 'number-pad' : 'phone-pad',
    content: Screen(
      { scroll: true },
      form,
      Button({
        label: 'Not now',
        variant: 'ghost',
        disabled: pending,
        block: true,
        style: { mt: spacing.lg },
        ...(pending ? {} : { back: true }),
      }),
    ),
  });
}

export function screens(s: Scenario): BoardScreen[] {
  // PhoneForm's submit(): a number that is not an Indian mobile only raises `invalid`.
  const sendFrom = (input: string): Link =>
    toIndianMobileE164(input) === null ? TO_INVALID : TO_CODE;

  // sendCode() hands the form's E.164 number to the code step.
  const phone = toIndianMobileE164(s.typedPhone);
  if (phone === null) {
    throw new Error('sign-in: the scenario phone is not an Indian mobile number');
  }

  // What the catch blocks put in `error` when the provider refuses the step (DataError 'auth').
  const sendFailed = authErrorMessage(new DataError('auth', 'refused'), 'send');
  const verifyFailed = authErrorMessage(new DataError('auth', 'refused'), 'verify');
  // A complete code the gateway refuses: the story's digits in reverse.
  const wrongOtp = [...s.typedOtp].reverse().join('');

  return [
    // ----- step.kind === 'phone' -----
    Sheet(
      {
        key: 'sign-in',
        name: 'Sign in · phone',
        note: 'The sign-in sheet with the number typed. It rises over the screen that asked for a session: "Hold seats" on Review, or "Sign in" on Bookings, Profile or a booking.',
        pending: false,
      },
      PhoneForm({
        pending: false,
        error: null,
        input: s.typedPhone,
        submit: sendFrom(s.typedPhone),
      }),
    ),
    Sheet(
      {
        key: 'sign-in-empty',
        name: 'Sign in · phone, empty',
        note: 'The sheet as it opens, and again after "Change number": the field is empty and focused, showing its placeholder.',
        pending: false,
      },
      PhoneForm({ pending: false, error: null, input: '', submit: sendFrom('') }),
    ),
    Sheet(
      {
        key: 'sign-in-invalid',
        name: 'Sign in · phone, not a mobile number',
        note: '"Send code" was pressed on something that is not a ten-digit Indian mobile number (here, nothing). Nothing is sent; the notice goes away with the next edit.',
        pending: false,
      },
      // Pressing "Send code" again lands on this same state, so it has no link.
      PhoneForm({ pending: false, error: null, input: '', invalid: true }),
    ),
    Sheet(
      {
        key: 'sign-in-sending',
        name: 'Sign in · phone, sending',
        note: 'The code is being requested: "Send code" spins and "Not now" is disabled until the gateway answers.',
        pending: true,
      },
      PhoneForm({ pending: true, error: null, input: s.typedPhone }),
    ),
    Sheet(
      {
        key: 'sign-in-send-failed',
        name: 'Sign in · phone, send failed',
        note: 'The sign-in service refused to send the code. The number stays in the field so the player can correct it or try again.',
        pending: false,
      },
      PhoneForm({
        pending: false,
        error: sendFailed,
        input: s.typedPhone,
        submit: sendFrom(s.typedPhone),
      }),
    ),

    // ----- step.kind === 'otp' -----
    Sheet(
      {
        key: 'sign-in-code',
        name: 'Sign in · code',
        note: 'The code step with all six digits typed. "Verify" signs the player in and closes the sheet, and the screen underneath carries on.',
        pending: false,
      },
      // "Resend code" ends on this same step with the digits kept, so it has no link here.
      OtpForm({
        phone,
        pending: false,
        error: null,
        token: s.typedOtp,
        submit: CLOSE,
        changeNumber: TO_EMPTY_PHONE,
      }),
    ),
    Sheet(
      {
        key: 'sign-in-code-empty',
        name: 'Sign in · code, empty',
        note: 'The code step as it appears once the SMS is sent: the field is empty and "Verify" stays disabled until six digits are in.',
        pending: false,
      },
      OtpForm({ phone, pending: false, error: null, token: '', changeNumber: TO_EMPTY_PHONE }),
    ),
    Sheet(
      {
        key: 'sign-in-code-pending',
        name: 'Sign in · code, verifying',
        note: 'The code is being checked, or a new one requested: "Verify" spins and every other button is disabled.',
        pending: true,
      },
      OtpForm({ phone, pending: true, error: null, token: s.typedOtp }),
    ),
    Sheet(
      {
        key: 'sign-in-code-wrong',
        name: 'Sign in · code, wrong code',
        note: 'The gateway refused the code. The digits stay in the field; the player can retype them, ask for a new code or change the number.',
        pending: false,
      },
      // "Verify" on the same digits fails the same way: no link. A resent code, once typed, is the story's.
      OtpForm({
        phone,
        pending: false,
        error: verifyFailed,
        token: wrongOtp,
        resend: TO_CODE,
        changeNumber: TO_EMPTY_PHONE,
      }),
    ),
  ];
}
