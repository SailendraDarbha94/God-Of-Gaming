import {
  istToInstant,
  type Area,
  type Cafe,
  type CafeImage,
  type City,
  type Game,
  type OpeningHours,
  type PlaceRef,
  type Promotion,
  type Slug,
  type StationKind,
  type StationTier,
  type Uuid,
  type Weekday,
} from '@gog/domain';
import { byName } from '../by-name';

/**
 * The sample dataset of `docs/spec/08-sample-data.md`, the same rows `supabase/seed.sql` inserts
 * (ids, texts, prices, hours), so the fixture repositories and a seeded database answer alike and
 * tests can name rows. Fictional development data: cafe names, addresses and prices are invented;
 * area names and coordinates are real public geography.
 *
 * Id scheme (version nibble 4, variant 8, as `z.uuid()` requires): cities `…-00000000000N`, areas
 * `…-0000000001NN`, games `…-0000000002NN`, cafes `…-00000000030C`, tiers `…-0000000003CT`,
 * stations `…-00000003CTSS`, promotions `…-00000000040N`, images `…-0000000005CN`.
 */

const UUID_PREFIX = '00000000-0000-4000-8000-';

/** `00000000-0000-4000-8000-` plus the suffix right-aligned in the twelve-digit last group. */
export function fixtureId(suffix: number | string): Uuid {
  return `${UUID_PREFIX}${String(suffix).padStart(12, '0')}`;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

const BENGALURU: PlaceRef = { slug: 'bengaluru', name: 'Bengaluru' };

const cities: City[] = [
  { id: fixtureId(1), ...BENGALURU, state: 'Karnataka', isLive: true },
  { id: fixtureId(2), slug: 'pune', name: 'Pune', state: 'Maharashtra', isLive: false },
  { id: fixtureId(3), slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', isLive: false },
];

const AREA_ROWS: [Slug, string, number, number][] = [
  ['koramangala', 'Koramangala', 12.9352, 77.6245],
  ['indiranagar', 'Indiranagar', 12.9784, 77.6408],
  ['hsr-layout', 'HSR Layout', 12.9116, 77.6389],
  ['whitefield', 'Whitefield', 12.9698, 77.75],
  ['marathahalli', 'Marathahalli', 12.9591, 77.6974],
  ['jayanagar', 'Jayanagar', 12.9308, 77.5838],
  ['jp-nagar', 'JP Nagar', 12.9063, 77.5857],
  ['electronic-city', 'Electronic City', 12.8399, 77.677],
  ['bellandur', 'Bellandur', 12.926, 77.6762],
  ['btm-layout', 'BTM Layout', 12.9166, 77.6101],
  ['malleshwaram', 'Malleshwaram', 13.0035, 77.5647],
  ['rajajinagar', 'Rajajinagar', 12.9915, 77.5527],
  ['hebbal', 'Hebbal', 13.0358, 77.597],
  ['yelahanka', 'Yelahanka', 13.1007, 77.5963],
  ['banashankari', 'Banashankari', 12.9255, 77.5468],
  ['sarjapur-road', 'Sarjapur Road', 12.91, 77.687],
  ['kalyan-nagar', 'Kalyan Nagar', 13.0247, 77.64],
  ['basavanagudi', 'Basavanagudi', 12.9416, 77.575],
];

const areas: Area[] = AREA_ROWS.map(([slug, name, lat, lng], index) => ({
  id: fixtureId(101 + index),
  citySlug: BENGALURU.slug,
  slug,
  name,
  lat,
  lng,
}));

const GAME_ROWS: [Slug, string, StationKind[]][] = [
  ['valorant', 'Valorant', ['pc']],
  ['counter-strike-2', 'Counter-Strike 2', ['pc']],
  ['gta-vi', 'Grand Theft Auto VI', ['ps5', 'xbox']],
  ['gta-v', 'Grand Theft Auto V', ['pc', 'ps5', 'xbox']],
  ['ea-sports-fc-26', 'EA Sports FC 26', ['pc', 'ps5', 'xbox', 'switch']],
  ['fortnite', 'Fortnite', ['pc', 'ps5', 'xbox', 'switch']],
  ['call-of-duty-warzone', 'Call of Duty: Warzone', ['pc', 'ps5', 'xbox']],
  ['tekken-8', 'Tekken 8', ['pc', 'ps5', 'xbox']],
  ['mortal-kombat-1', 'Mortal Kombat 1', ['pc', 'ps5', 'xbox', 'switch']],
  ['apex-legends', 'Apex Legends', ['pc', 'ps5', 'xbox']],
  ['dota-2', 'Dota 2', ['pc']],
  ['marvel-rivals', 'Marvel Rivals', ['pc', 'ps5', 'xbox']],
  ['gran-turismo-7', 'Gran Turismo 7', ['ps5']],
  ['assetto-corsa-competizione', 'Assetto Corsa Competizione', ['pc', 'sim_racing']],
  ['beat-saber', 'Beat Saber', ['vr']],
  ['mario-kart-world', 'Mario Kart World', ['switch']],
];

const games: Game[] = GAME_ROWS.map(([slug, name, kinds], index) => ({
  id: fixtureId(201 + index),
  slug,
  name,
  kinds,
}));

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const FRIDAY = 5;
const SATURDAY = 6;

function weeklyHours(rule: (weekday: Weekday) => Omit<OpeningHours, 'weekday'>): OpeningHours[] {
  return WEEKDAYS.map((weekday) => ({ weekday, ...rule(weekday) }));
}

function isWeekendNight(weekday: Weekday): boolean {
  return weekday === FRIDAY || weekday === SATURDAY;
}

/** Sun–Thu 10:00–23:00, Fri–Sat 10:00–02:00 overnight (the default of spec 08). */
const standardHours = weeklyHours((weekday) =>
  isWeekendNight(weekday)
    ? { opensAt: '10:00', closesAt: '02:00', isOvernight: true }
    : { opensAt: '10:00', closesAt: '23:00', isOvernight: false },
);

/** Side Quest: daily 11:00–23:30, never overnight. */
const sideQuestHours = weeklyHours(() => ({
  opensAt: '11:00',
  closesAt: '23:30',
  isOvernight: false,
}));

/** Clutch Arena: Fri–Sat 10:00–04:00 overnight. */
const clutchArenaHours = weeklyHours((weekday) =>
  isWeekendNight(weekday)
    ? { opensAt: '10:00', closesAt: '04:00', isOvernight: true }
    : { opensAt: '10:00', closesAt: '23:00', isOvernight: false },
);

interface TierSeed {
  name: string;
  kind: StationKind;
  hourlyRatePaise: number;
  stationCount: number;
  /** Station labels are `<prefix>-01`, `<prefix>-02`, … so two PC tiers never share a label. */
  labelPrefix: string;
  description: string;
  specs: Record<string, string>;
}

interface CafeSeed {
  slug: Slug;
  name: string;
  areaSlug: Slug;
  addressLine: string;
  /** `null` for every sample cafe: there is no reserved fictional mobile range in India. */
  whatsapp: string | null;
  description: string;
  amenities: string[];
  hours: OpeningHours[];
  tiers: TierSeed[];
  gameSlugs: Slug[];
}

const CAFE_SEEDS: CafeSeed[] = [
  {
    slug: 'pixel-den-koramangala',
    name: 'Pixel Den',
    areaSlug: 'koramangala',
    addressLine: '12, 5th Block, Koramangala',
    whatsapp: null,
    description:
      'A 24-seat PC and PS5 cafe on 5th Block, a short walk from the Koramangala bus stand. Standard and Premium PC rows face each other, and the PS5 lounge sits in a separate room with couches. Open past midnight on Fridays and Saturdays.',
    amenities: ['ac', 'food', 'late-night'],
    hours: standardHours,
    tiers: [
      {
        name: 'Standard PC',
        kind: 'pc',
        hourlyRatePaise: 8000,
        stationCount: 12,
        labelPrefix: 'STD',
        description: 'Everyday competitive PCs on 165 Hz monitors.',
        specs: { gpu: 'RTX 4060', refresh_rate: '165 Hz' },
      },
      {
        name: 'Premium PC',
        kind: 'pc',
        hourlyRatePaise: 12000,
        stationCount: 8,
        labelPrefix: 'PRM',
        description: 'Higher-end PCs on 240 Hz monitors.',
        specs: { gpu: 'RTX 5070', refresh_rate: '240 Hz' },
      },
      {
        name: 'PS5 Lounge',
        kind: 'ps5',
        hourlyRatePaise: 15000,
        stationCount: 4,
        labelPrefix: 'PS5',
        description: 'PS5 consoles on 55-inch 4K screens in a separate room.',
        specs: { display: '55" 4K' },
      },
    ],
    gameSlugs: [
      'valorant',
      'counter-strike-2',
      'ea-sports-fc-26',
      'gta-v',
      'fortnite',
      'marvel-rivals',
    ],
  },
  {
    slug: 'frame-rate-indiranagar',
    name: 'Frame Rate',
    areaSlug: 'indiranagar',
    addressLine: '100 Feet Road, Indiranagar',
    whatsapp: null,
    description:
      'Sixteen high-refresh PCs and two sim racing rigs above a cafe on 100 Feet Road. The rigs have direct-drive wheels, load-cell pedals and triple screens. Food and coffee come from the kitchen downstairs.',
    amenities: ['ac', 'cafe', 'parking'],
    hours: standardHours,
    tiers: [
      {
        name: 'Pro PC',
        kind: 'pc',
        hourlyRatePaise: 11000,
        stationCount: 16,
        labelPrefix: 'PRO',
        description: 'Tournament-grade PCs on 360 Hz monitors.',
        specs: { gpu: 'RTX 5070 Ti', refresh_rate: '360 Hz' },
      },
      {
        name: 'Sim Rig',
        kind: 'sim_racing',
        hourlyRatePaise: 30000,
        stationCount: 2,
        labelPrefix: 'SIM',
        description: 'Direct-drive racing rigs with triple screens.',
        specs: { wheel: 'Fanatec', display: 'Triple screen' },
      },
    ],
    gameSlugs: [
      'valorant',
      'counter-strike-2',
      'apex-legends',
      'dota-2',
      'assetto-corsa-competizione',
    ],
  },
  {
    slug: 'respawn-room-hsr',
    name: 'Respawn Room',
    areaSlug: 'hsr-layout',
    addressLine: '27th Main, HSR Layout Sector 1',
    whatsapp: null,
    description:
      'A neighbourhood cafe in HSR Layout Sector 1 with twenty Standard PCs, six PS5 setups and a closed five-seat squad room. The squad room has its own door and air conditioning. Parking is on the street outside.',
    amenities: ['ac', 'private-room', 'food'],
    hours: standardHours,
    tiers: [
      {
        name: 'Standard PC',
        kind: 'pc',
        hourlyRatePaise: 7000,
        stationCount: 20,
        labelPrefix: 'STD',
        description: 'Everyday competitive PCs on 144 Hz monitors.',
        specs: { gpu: 'RTX 4060', refresh_rate: '144 Hz' },
      },
      {
        name: 'PS5',
        kind: 'ps5',
        hourlyRatePaise: 14000,
        stationCount: 6,
        labelPrefix: 'PS5',
        description: 'PS5 consoles on 4K TVs.',
        specs: { display: '4K TV' },
      },
      {
        name: 'Private Squad Room',
        kind: 'pc',
        hourlyRatePaise: 15000,
        stationCount: 5,
        labelPrefix: 'ROOM',
        description: 'Five high-end PCs in a closed room for one squad.',
        specs: { gpu: 'RTX 5080', refresh_rate: '240 Hz', room: 'Closed room' },
      },
    ],
    gameSlugs: [
      'valorant',
      'counter-strike-2',
      'call-of-duty-warzone',
      'ea-sports-fc-26',
      'tekken-8',
      'gta-v',
    ],
  },
  {
    slug: 'overclock-lounge-whitefield',
    name: 'Overclock Lounge',
    areaSlug: 'whitefield',
    addressLine: 'ITPL Main Road, Whitefield',
    whatsapp: null,
    description:
      'Ten Elite PCs with OLED monitors and a two-headset VR bay near ITPL. Seats are spaced for tournaments and the floor has a small streaming corner. Weekends run past midnight.',
    amenities: ['ac', 'streaming-setup', 'tournament-ready', 'late-night', 'parking'],
    hours: standardHours,
    tiers: [
      {
        name: 'Elite PC',
        kind: 'pc',
        hourlyRatePaise: 13000,
        stationCount: 10,
        labelPrefix: 'ELT',
        description: 'High-end PCs on 240 Hz OLED monitors.',
        specs: { gpu: 'RTX 5080', refresh_rate: '240 Hz', panel: 'OLED' },
      },
      {
        name: 'VR Bay',
        kind: 'vr',
        hourlyRatePaise: 25000,
        stationCount: 2,
        labelPrefix: 'VR',
        description: 'Roomscale VR with Quest 3 headsets.',
        specs: { headset: 'Quest 3', tracking: 'Roomscale' },
      },
    ],
    gameSlugs: ['valorant', 'counter-strike-2', 'apex-legends', 'beat-saber', 'marvel-rivals'],
  },
  {
    slug: 'side-quest-jayanagar',
    name: 'Side Quest',
    areaSlug: 'jayanagar',
    addressLine: '4th Block, Jayanagar',
    whatsapp: null,
    description:
      'A console-only cafe in 4th Block with six PS5 setups, two Xbox Series X stations and a Nintendo Switch corner. Groups of friends and families are the usual crowd. Closes at 23:30 every day.',
    amenities: ['ac', 'food', 'wheelchair-access'],
    hours: sideQuestHours,
    tiers: [
      {
        name: 'PS5',
        kind: 'ps5',
        hourlyRatePaise: 15000,
        stationCount: 6,
        labelPrefix: 'PS5',
        description: 'PS5 consoles on 4K TVs.',
        specs: { display: '4K TV' },
      },
      {
        name: 'Xbox',
        kind: 'xbox',
        hourlyRatePaise: 14000,
        stationCount: 2,
        labelPrefix: 'XBX',
        description: 'Xbox Series X consoles.',
        specs: { console: 'Series X' },
      },
      {
        name: 'Switch Corner',
        kind: 'switch',
        hourlyRatePaise: 10000,
        stationCount: 2,
        labelPrefix: 'NSW',
        description: 'Nintendo Switch 2 consoles with local multiplayer.',
        specs: { console: 'Switch 2' },
      },
    ],
    gameSlugs: [
      'gta-vi',
      'gta-v',
      'ea-sports-fc-26',
      'mortal-kombat-1',
      'gran-turismo-7',
      'mario-kart-world',
    ],
  },
  {
    slug: 'clutch-arena-marathahalli',
    name: 'Clutch Arena',
    areaSlug: 'marathahalli',
    addressLine: 'Outer Ring Road, Marathahalli',
    whatsapp: null,
    description:
      'A 34-seat esports venue on Outer Ring Road with a ten-PC tournament stage. Standard PC rows take walk-ins; the stage is booked for scrims and community cups. Open until 04:00 on Fridays and Saturdays.',
    amenities: ['ac', 'tournament-ready', 'streaming-setup', 'late-night', 'parking'],
    hours: clutchArenaHours,
    tiers: [
      {
        name: 'Standard PC',
        kind: 'pc',
        hourlyRatePaise: 7500,
        stationCount: 24,
        labelPrefix: 'STD',
        description: 'Everyday competitive PCs on 165 Hz monitors.',
        specs: { gpu: 'RTX 4060', refresh_rate: '165 Hz' },
      },
      {
        name: 'Stage PC',
        kind: 'pc',
        hourlyRatePaise: 14000,
        stationCount: 10,
        labelPrefix: 'STG',
        description: 'Ten PCs on the tournament stage, 360 Hz monitors.',
        specs: { gpu: 'RTX 5080', refresh_rate: '360 Hz', setting: 'Tournament stage' },
      },
    ],
    gameSlugs: [
      'valorant',
      'counter-strike-2',
      'dota-2',
      'apex-legends',
      'fortnite',
      'call-of-duty-warzone',
    ],
  },
];

/** One bookable seat; the domain has no station entity because stations only matter to holds. */
export interface FixtureStation {
  id: Uuid;
  tierId: Uuid;
  label: string;
  isActive: boolean;
}

function findArea(slug: Slug): Area {
  const area = areas.find((candidate) => candidate.slug === slug);
  if (area === undefined) {
    throw new RangeError(`Unknown area in fixtures: ${slug}`);
  }
  return area;
}

function findGame(slug: Slug): Game {
  const game = games.find((candidate) => candidate.slug === slug);
  if (game === undefined) {
    throw new RangeError(`Unknown game in fixtures: ${slug}`);
  }
  return game;
}

/** Three picsum placeholders per cafe, seeded `<cafe-slug>-<n>`, like the seed. */
function imagesFor(cafeNo: number, seed: CafeSeed): CafeImage[] {
  return [1, 2, 3].map((n) => ({
    id: fixtureId(`5${cafeNo}${n}`),
    url: `https://picsum.photos/seed/${seed.slug}-${n}/1200/800`,
    alt: `${seed.name}, photo ${n}`,
    sortOrder: n - 1,
  }));
}

function tiersFor(cafeNo: number, seed: CafeSeed): StationTier[] {
  return seed.tiers.map((tier, index) => ({
    id: fixtureId(`3${cafeNo}${index + 1}`),
    cafeId: fixtureId(`30${cafeNo}`),
    kind: tier.kind,
    name: tier.name,
    description: tier.description,
    hourlyRatePaise: tier.hourlyRatePaise,
    stationCount: tier.stationCount,
    specs: tier.specs,
    sortOrder: index,
  }));
}

function stationsFor(cafeNo: number, seed: CafeSeed): FixtureStation[] {
  return seed.tiers.flatMap((tier, index) =>
    Array.from({ length: tier.stationCount }, (_, offset) => ({
      id: fixtureId(`3${cafeNo}${index + 1}${pad2(offset + 1)}`),
      tierId: fixtureId(`3${cafeNo}${index + 1}`),
      label: `${tier.labelPrefix}-${pad2(offset + 1)}`,
      isActive: true,
    })),
  );
}

/** Coordinates are the area centre (spec 08 gives none per cafe); `mapsUrl` is derived from them. */
function cafeFor(cafeNo: number, seed: CafeSeed): Cafe {
  const area = findArea(seed.areaSlug);
  return {
    id: fixtureId(`30${cafeNo}`),
    slug: seed.slug,
    name: seed.name,
    status: 'live',
    city: BENGALURU,
    area: { slug: area.slug, name: area.name },
    addressLine: seed.addressLine,
    lat: area.lat,
    lng: area.lng,
    description: seed.description,
    amenities: seed.amenities,
    whatsapp: seed.whatsapp,
    mapsUrl: `https://maps.google.com/?q=${area.lat},${area.lng}`,
    images: imagesFor(cafeNo, seed),
    hours: seed.hours,
    tiers: tiersFor(cafeNo, seed),
    games: seed.gameSlugs.map(findGame).sort(byName),
  };
}

const cafes: Cafe[] = CAFE_SEEDS.map((seed, index) => cafeFor(index + 1, seed));

const stations: FixtureStation[] = CAFE_SEEDS.flatMap((seed, index) =>
  stationsFor(index + 1, seed),
);

function cafeRef(slug: Slug): Promotion['cafe'] {
  const cafe = cafes.find((candidate) => candidate.slug === slug);
  if (cafe === undefined) {
    throw new RangeError(`Unknown cafe in fixtures: ${slug}`);
  }
  return { id: cafe.id, slug: cafe.slug, name: cafe.name };
}

/** Instants are given in IST, as spec 08 lists them, and stored as UTC (ADR 0009). */
const promotions: Promotion[] = [
  {
    id: fixtureId(401),
    slug: 'gta-vi-launch-night',
    title: 'GTA VI launch night',
    summary:
      'Play Grand Theft Auto VI from the first minute at Side Quest, Jayanagar, with PS5 seats held for squads.',
    body: 'Grand Theft Auto VI releases on 19 November 2026 and Side Quest has it on every PS5 from 6 pm. Seats go in 30-minute blocks, so hold one for your squad in the app before you come.\n\nThe cafe runs past its usual closing time for the night. Snacks and drinks are on the menu as usual; the Switch corner stays open for anyone waiting.',
    imageUrl: 'https://picsum.photos/seed/gta-vi-launch-night/1200/800',
    cafe: cafeRef('side-quest-jayanagar'),
    citySlug: BENGALURU.slug,
    startsAt: istToInstant('2026-11-19', 18 * 60),
    endsAt: istToInstant('2026-11-20', 2 * 60),
    ctaLabel: 'Reserve a PS5 in the app',
    ctaUrl: 'gog://cafe/side-quest-jayanagar',
    isFeatured: true,
  },
  {
    id: fixtureId(402),
    slug: 'squad-saturdays',
    title: 'Squad Saturdays: book 5 seats, play 6 hours',
    summary:
      'Hold five seats of one tier for a Saturday and play six hours for the price of five at listed Bengaluru cafes.',
    body: 'Every Saturday until the end of January, a squad booking of five seats of the same tier gets its sixth hour free at every cafe listed in Bengaluru. The discount is applied at the counter when you check in.\n\nBook the six hours in the app as usual; the hold works the same way. One offer per squad per day.',
    imageUrl: 'https://picsum.photos/seed/squad-saturdays/1200/800',
    cafe: null,
    citySlug: BENGALURU.slug,
    startsAt: istToInstant('2026-11-07', 0),
    endsAt: istToInstant('2027-01-31', 23 * 60 + 59),
    ctaLabel: 'Find a cafe',
    ctaUrl: '/cafes',
    isFeatured: true,
  },
  {
    id: fixtureId(403),
    slug: 'valorant-community-cup',
    title: 'Valorant community cup, December qualifiers',
    summary:
      'Open five-a-side Valorant qualifiers on the Clutch Arena stage over the first weekend of December.',
    body: 'Sixteen teams play best-of-one qualifiers on Saturday and the top eight return on Sunday for best-of-three brackets. Matches run on the Stage PCs; the Standard PC rows stay open for walk-ins.\n\nRegistration is at the counter and closes on 3 December. Teams need five players and one substitute; the rules follow the current competitive ruleset.',
    imageUrl: 'https://picsum.photos/seed/valorant-community-cup/1200/800',
    cafe: cafeRef('clutch-arena-marathahalli'),
    citySlug: BENGALURU.slug,
    startsAt: istToInstant('2026-12-05', 11 * 60),
    endsAt: istToInstant('2026-12-06', 22 * 60),
    ctaLabel: 'Read the rules',
    ctaUrl: '/events/valorant-community-cup',
    isFeatured: false,
  },
  {
    id: fixtureId(404),
    slug: 'late-night-pc-rates',
    title: 'Late-night PC rates at Pixel Den',
    summary:
      'Standard and Premium PCs at Pixel Den cost less after 11 pm on Fridays and Saturdays.',
    body: 'From 11 pm on Fridays and Saturdays, Standard PCs are Rs 60 an hour and Premium PCs Rs 90 an hour until closing at 2 am. The lower rate is applied at the counter to the hours after 11 pm.\n\nHold your seats in the app at the listed rate; the difference is settled when you pay at the cafe.',
    imageUrl: 'https://picsum.photos/seed/late-night-pc-rates/1200/800',
    cafe: cafeRef('pixel-den-koramangala'),
    citySlug: BENGALURU.slug,
    startsAt: istToInstant('2026-11-04', 0),
    endsAt: null,
    ctaLabel: null,
    ctaUrl: null,
    isFeatured: false,
  },
];

export interface FixtureDataset {
  cities: readonly City[];
  areas: readonly Area[];
  games: readonly Game[];
  cafes: readonly Cafe[];
  stations: readonly FixtureStation[];
  /** Published promotions only, as an anonymous reader sees them. */
  promotions: readonly Promotion[];
}

export const bengaluru: FixtureDataset = { cities, areas, games, cafes, stations, promotions };
