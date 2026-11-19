'use client';

import { useId, useState, type FormEvent } from 'react';

import { copy } from './copy';

/**
 * The phone step of sign-in, which does nothing yet. M1 sends the code through the AuthGateway
 * (`toIndianMobileE164`), adds the six-digit code step with "Resend code" after 60 seconds, accepts
 * invitations and redirects (docs/spec/09-partner-app.md, Routes and Data access). The number field
 * has no maxLength, so autofill of a longer form (+91 98…) is not cut.
 */
export function SignInScreen() {
  const phoneId = useId();
  const hintId = useId();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(copy.notConnected);
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
      <p className="text-muted mt-2">{copy.lead}</p>
      <form className="mt-8" onSubmit={onSubmit} noValidate>
        <label htmlFor={phoneId} className="block text-sm font-semibold">
          {copy.phoneLabel}
        </label>
        <div className="mt-2 flex items-stretch gap-2">
          <span
            aria-hidden="true"
            className="border-field-border bg-surface-2 text-muted flex min-h-11 items-center rounded-md border px-3"
          >
            {copy.phonePrefix}
          </span>
          <input
            id={phoneId}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
            }}
            aria-describedby={hintId}
            className="field"
          />
        </div>
        <p id={hintId} className="text-muted mt-2 text-sm">
          {copy.phoneHint}
        </p>
        <button type="submit" className="btn btn-primary mt-6 w-full">
          {copy.sendCode}
        </button>
        <p role="status" className="mt-4 min-h-5 text-sm">
          {status}
        </p>
      </form>
    </div>
  );
}
