import { FixtureAuthGateway } from './auth/fixture-auth';
import type { AuthGateway } from './auth/gateway';
import { SupabaseAuthGateway } from './auth/supabase-auth';
import { FixtureBookingRepository } from './booking/fixture-booking';
import type { BookingRepository } from './booking/repository';
import { SupabaseBookingRepository } from './booking/supabase-booking';
import { FixtureCatalogRepository } from './catalog/fixture-catalog';
import type { CatalogRepository } from './catalog/repository';
import { SupabaseCatalogRepository } from './catalog/supabase-catalog';
import type { DataClient } from './client';
import { systemClock, type Clock } from './clock';
import { sharedFixtureSession } from './fixtures/session-store';

/**
 * How the apps choose an implementation (ADR 0012): from one option, never by importing a concrete
 * class. The apps read `GOG_DATA_SOURCE` / `EXPO_PUBLIC_DATA_SOURCE` themselves and pass `source`.
 */
export type DataSourceOptions =
  | { source: 'supabase'; client: DataClient }
  | {
      source: 'fixtures';
      /** The clock the in-memory booking flow reads; the system clock unless a test injects one. */
      now?: Clock;
    };

export function createCatalogRepository(options: DataSourceOptions): CatalogRepository {
  switch (options.source) {
    case 'supabase':
      return new SupabaseCatalogRepository(options.client);
    case 'fixtures':
      return new FixtureCatalogRepository();
  }
}

/** On fixtures the repository reads the session the fixture auth gateway writes (same store). */
export function createBookingRepository(options: DataSourceOptions): BookingRepository {
  switch (options.source) {
    case 'supabase':
      return new SupabaseBookingRepository(options.client);
    case 'fixtures':
      return new FixtureBookingRepository({
        now: options.now ?? systemClock,
        session: sharedFixtureSession,
      });
  }
}

export function createAuthGateway(options: DataSourceOptions): AuthGateway {
  switch (options.source) {
    case 'supabase':
      return new SupabaseAuthGateway(options.client);
    case 'fixtures':
      return new FixtureAuthGateway(sharedFixtureSession);
  }
}
