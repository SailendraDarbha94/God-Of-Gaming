export const INDIA_DIAL_CODE = '+91';

/** Indian mobile numbers are ten digits starting 6–9 (the launch market, ADR 0006). */
const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const LOCAL_DIGITS = 10;

/**
 * The digits a player meant: formatting stripped, a leading country code (`+91`, twelve digits) or
 * trunk `0` (eleven digits) dropped, then capped at ten. Prefixes are stripped before the cap on
 * purpose: capping first would turn `+919876543210` into `9198765432`. A genuine number that starts
 * with 91 (`9112345678`) is untouched because the 91 rule fires at exactly twelve digits, which
 * typing can never reach under the cap. OS autofill ("+91 98765 43210"), a pasted "098765 43210"
 * and a typed "9876543210" all become `9876543210`.
 */
export function normaliseIndianMobileInput(text: string): string {
  let digits = text.replace(/\D/g, '');
  if (digits.length === LOCAL_DIGITS + 2 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === LOCAL_DIGITS + 1 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, LOCAL_DIGITS);
}

/**
 * Turns whatever was typed into the E.164 form the gateway sends to Supabase (`+91…`, spec 02
 * §Entities), or `null` when it is not an Indian mobile number.
 */
export function toIndianMobileE164(input: string): string | null {
  const local = normaliseIndianMobileInput(input);
  return INDIAN_MOBILE.test(local) ? `${INDIA_DIAL_CODE}${local}` : null;
}
