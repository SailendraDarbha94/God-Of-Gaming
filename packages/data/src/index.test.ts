import { describe, expect, it } from 'vitest';
import * as data from './index';

/** The runtime surface of the package root, pinned so a forgotten re-export is caught. */
const PUBLIC_VALUES = [
  // errors
  'DataError',
  'dataErrorFromPostgrest',
  'isTransportFailure',
  // client
  'createNativeClient',
  'createPublicClient',
  'createServerClock',
  'assertPublishableKey',
  'isPublishableKey',
  'PublishableKeyError',
  // catalog
  'FixtureCatalogRepository',
  'SupabaseCatalogRepository',
  'toArea',
  'toCafe',
  'toCafeCard',
  'toCity',
  'toPromotion',
  // booking
  'FixtureBookingRepository',
  'SupabaseBookingRepository',
  'mapPostgrestError',
  'systemClock',
  'toAvailabilitySlot',
  'toBooking',
  // auth
  'AuthSession',
  'FIXTURE_OTP',
  'FixtureAuthGateway',
  'SupabaseAuthGateway',
  'toAuthSession',
  'userIdForPhone',
  // fixtures
  'FixtureSessionStore',
  'bengaluru',
  'fixtureId',
  'sharedFixtureSession',
  // factory
  'createAuthGateway',
  'createBookingRepository',
  'createCatalogRepository',
].sort();

describe('@gog/data root export', () => {
  it('exposes exactly the documented runtime values', () => {
    expect(Object.keys(data).sort()).toEqual(PUBLIC_VALUES);
  });
});
