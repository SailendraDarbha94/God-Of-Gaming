import { describe, expect, it, vi } from 'vitest';
import { DataError } from '../errors';
import { FixtureSessionStore } from '../fixtures/session-store';
import { FIXTURE_OTP, FixtureAuthGateway, userIdForPhone } from './fixture-auth';
import { AuthSession } from './gateway';

const PHONE = '+919999900001';
const EXPECTED_SESSION = {
  userId: '00000000-0000-4000-8000-919999900001',
  phone: '919999900001',
  expiresAt: null,
};

describe('FixtureAuthGateway', () => {
  it('signs in with the test OTP and publishes the session to the shared store', async () => {
    const store = new FixtureSessionStore();
    const gateway = new FixtureAuthGateway(store);
    const listener = vi.fn();
    const unsubscribe = gateway.onAuthStateChange(listener);

    expect(await gateway.getSession()).toBeNull();
    await gateway.signInWithPhone(PHONE);
    const session = await gateway.verifyOtp(PHONE, FIXTURE_OTP);

    expect(session).toEqual(EXPECTED_SESSION);
    expect(() => AuthSession.parse(session)).not.toThrow();
    expect(store.get()).toEqual(EXPECTED_SESSION);
    expect(await gateway.getSession()).toEqual(EXPECTED_SESSION);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(EXPECTED_SESSION);

    await gateway.signOut();
    expect(await gateway.getSession()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    await gateway.signInWithPhone(PHONE);
    await gateway.verifyOtp(PHONE, FIXTURE_OTP);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('derives a stable user id from the phone number', () => {
    expect(userIdForPhone('919999900001')).toBe('00000000-0000-4000-8000-919999900001');
    expect(userIdForPhone('919999900001')).toBe(userIdForPhone('919999900001'));
    expect(userIdForPhone('919999900002')).not.toBe(userIdForPhone('919999900001'));
  });

  it('refuses a number that is not E.164', async () => {
    const gateway = new FixtureAuthGateway(new FixtureSessionStore());
    await expect(gateway.signInWithPhone('9999900001')).rejects.toBeInstanceOf(DataError);
    await expect(gateway.signInWithPhone('+91 99999 00001')).rejects.toMatchObject({
      code: 'auth',
    });
  });

  it('refuses a wrong code and a code for a number that never asked', async () => {
    const store = new FixtureSessionStore();
    const gateway = new FixtureAuthGateway(store);
    await expect(gateway.verifyOtp(PHONE, FIXTURE_OTP)).rejects.toMatchObject({ code: 'auth' });
    await gateway.signInWithPhone(PHONE);
    await expect(gateway.verifyOtp(PHONE, '000000')).rejects.toMatchObject({ code: 'auth' });
    await expect(gateway.verifyOtp('+919999900002', FIXTURE_OTP)).rejects.toMatchObject({
      code: 'auth',
    });
    expect(store.get()).toBeNull();
  });
});
