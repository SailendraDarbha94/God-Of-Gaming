import type { Paise } from './scalars';

/** `en-IN` groups in lakhs and crores: 12,50,000 (ADR 0009). Integer-only, so no float rounding. */
const rupeeFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export interface FormatPaiseOptions {
  /** Render `₹120.00` instead of `₹120`. Non-zero paise are always shown. */
  alwaysShowPaise?: boolean | undefined;
}

/** `₹120`, `₹62.50`, `₹1,250`, `₹1,25,000`. */
export function formatPaise(paise: Paise, options: FormatPaiseOptions = {}): string {
  const rupees = Math.floor(paise / 100);
  const remainder = paise % 100;
  const whole = `₹${rupeeFormatter.format(rupees)}`;
  if (remainder === 0 && options.alwaysShowPaise !== true) {
    return whole;
  }
  return `${whole}.${remainder.toString().padStart(2, '0')}`;
}

/** `₹120/hr`: the per-hour form both apps show for a tier's rate. */
export function formatHourlyRate(paise: Paise): string {
  return `${formatPaise(paise)}/hr`;
}
