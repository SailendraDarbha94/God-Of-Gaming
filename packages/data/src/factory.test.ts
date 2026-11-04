import { BookingError } from '@gog/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { FixtureAuthGateway, FIXTURE_OTP } from './auth/fixture-auth';
import { SupabaseAuthGateway } from './auth/supabase-auth';
import { FixtureBookingRepository } from './booking/fixture-booking';
import { SupabaseBookingRepository } from './booking/supabase-booking';
import { FixtureCatalogRepository } from './catalog/fixture-catalog';
import { SupabaseCatalogRepository } from './catalog/supabase-catalog';
import { createPublicClient } from './client';
import { createAuthGateway, createBookingRepository, createCatalogRepository } from './factory';
import { fixtureId } from './fixtures/bengaluru';
import { sharedFixtureSession } from './fixtures/session-store';

describe('factory', () => {
  afterEach(() => {
    sharedFixtureSession.set(null);
  });

  it('builds the fixture implementations from { source: "fixtures" }', () => {
    expect(createCatalogRepository({ source: 'fixtures' })).toBeInstanceOf(
      FixtureCatalogRepository,
    );
    expect(createBookingRepository({ source: 'fixtures' })).toBeInstanceOf(
      FixtureBookingRepository,
    );
    expect(createAuthGateway({ source: 'fixtures' })).toBeInstanceOf(FixtureAuthGateway);
  });

  it('builds the Supabase implementations around the given client', () => {
    const client = createPublicClient({ url: 'http://127.0.0.1:54321', key: 'anon-key' });
    expect(createCatalogRepository({ source: 'supabase', client })).toBeInstanceOf(
      SupabaseCatalogRepository,
    );
    expect(createBookingRepository({ source: 'supabase', client })).toBeInstanceOf(
      SupabaseBookingRepository,
    );
    expect(createAuthGateway({ source: 'supabase', client })).toBeInstanceOf(SupabaseAuthGateway);
  });

  it('links the fixture auth gateway and booking repository through one session', async () => {
    const now = () => '2026-11-10T04:30:00Z';
    const auth = createAuthGateway({ source: 'fixtures' });
    const booking = createBookingRepository({ source: 'fixtures', now });
    const request = {
      cafeId: fixtureId(301),
      tierId: fixtureId(311),
      startsAt: '2026-11-17T08:30:00Z',
      durationMinutes: 60,
      seatCount: 1,
    };

    await expect(booking.createHold(request)).rejects.toMatchObject({ code: 'auth_required' });

    await auth.signInWithPhone('+919999900001');
    await auth.verifyOtp('+919999900001', FIXTURE_OTP);
    const held = await booking.createHold(request);
    expect(held.status).toBe('held');
    expect(await booking.listMine()).toHaveLength(1);

    await auth.signOut();
    await expect(booking.confirm(held.id)).rejects.toBeInstanceOf(BookingError);
    expect(await booking.listMine()).toEqual([]);
  });
});
