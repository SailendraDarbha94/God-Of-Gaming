/** app/(tabs)/index.tsx */
import { Phone, Screen, ScrollView } from '@board/chrome';
import { CafeCard } from '@board/components/CafeCard';
import { CafeCardSkeleton } from '@board/components/catalog';
import { ExploreFilters } from '@board/components/ExploreFilters';
import { EmptyState, ErrorState } from '@board/components/shared';
import {
  box,
  spacing,
  type Child,
  type Frame,
  type FrameProps,
  type Node,
  type Screen as BoardScreen,
} from '@board/dsl';
import type { ExploreFilter, Scenario } from '@board/scenario';
import type { Link } from '@board/ui';
import { StationKind, type Area, type CafeCard as CafeCardModel } from '@gog/domain';

const ROUTE = 'app/(tabs)/index.tsx';

/** index.tsx: const SKELETON_COUNT = 3 (not exported). */
const SKELETON_COUNT = 3;

/** useState<ExploreFilter>({ areaSlug: null, kind: null }): the filter the screen opens with. */
const NO_FILTER: ExploreFilter = { areaSlug: null, kind: null };

const sameFilter = (a: ExploreFilter, b: ExploreFilter): boolean =>
  a.areaSlug === b.areaSlug && a.kind === b.kind;

/** Stands in for ExploreFilters' onChange: asked once per chip with the filter that chip would set. */
type FilterChange = (next: ExploreFilter) => Link | undefined;

/**
 * Gives every chip of one of ExploreFilters' two rows its link. `row` is the horizontal ScrollView
 * the component built; `nexts` lists, chip by chip, the filter its onPress passes to onChange.
 */
function linkChips(
  row: Node | undefined,
  nexts: ExploreFilter[],
  change: FilterChange,
  viewport: FrameProps = {},
): Frame {
  const content = row?.t === 'frame' ? row.children?.[0] : undefined;
  if (row?.t !== 'frame' || content?.t !== 'frame' || content.children?.length !== nexts.length) {
    throw new Error(
      'explore: components/ExploreFilters.ts no longer has the chip rows this file links',
    );
  }
  return {
    ...row,
    ...viewport,
    children: [
      {
        ...content,
        children: content.children.map((chip, index) => {
          const next = nexts[index];
          return next === undefined ? chip : { ...chip, ...change(next) };
        }),
      },
    ],
  };
}

interface HeaderProps {
  areas: Area[];
  filter: ExploreFilter;
  change: FilterChange;
  /**
   * The area row drawn at the end of its scroll, where the player left it to reach a chip that sits
   * past the right edge. The row keeps its offset: the list header stays mounted across filters.
   */
  areasScrolledToEnd?: boolean;
}

/**
 * <ExploreFilters areas filter onChange={setFilter} />: the component's own tree, with the link
 * for each chip's onPress added. The filters each chip asks for are ExploreFilters.tsx's, line by
 * line: "All areas" / "Everything" clear their half, any other chip sets it, or clears it when it
 * is already on.
 */
function Header({ areas, filter, change, areasScrolledToEnd = false }: HeaderProps): Frame {
  const filters = ExploreFilters({ areas, filter });
  const [titles, areaRow, kindRow, ...rest] = filters.children ?? [];
  if (titles === undefined || rest.length !== 0) {
    throw new Error('explore: components/ExploreFilters.ts no longer has titles and two chip rows');
  }
  return {
    ...filters,
    children: [
      titles,
      linkChips(
        areaRow,
        [
          { ...filter, areaSlug: null },
          ...areas.map((area) => ({
            ...filter,
            areaSlug: filter.areaSlug === area.slug ? null : area.slug,
          })),
        ],
        change,
        areasScrolledToEnd ? { justify: 'end' } : {},
      ),
      linkChips(
        kindRow,
        [
          { ...filter, kind: null },
          ...StationKind.options.map((kind) => ({
            ...filter,
            kind: filter.kind === kind ? null : kind,
          })),
        ],
        change,
      ),
    ],
  };
}

/** function Gap(): <View style={styles.gap} />, the list's ItemSeparatorComponent. */
function Gap(): Frame {
  return box({ name: 'Gap', h: spacing.md });
}

/**
 * <Screen padded={false} safeTop><FlatList .../></Screen>: the filters are the list's header; under
 * them, straight in the content container, come the cards with a Gap between each two, or
 * ListEmptyComponent when there is no data.
 */
function List(header: Frame, body: Child): Frame {
  return Screen(
    { padded: false, safeTop: true },
    ScrollView(
      { content: { pad: [spacing.lg, spacing.lg, spacing.xxl, spacing.lg] } },
      header,
      body,
    ),
  );
}

export function screens(s: Scenario): BoardScreen[] {
  // The filters the board draws a frame for. A chip that sets one of them links to that frame.
  const drawn: readonly (readonly [ExploreFilter, string])[] = [
    [NO_FILTER, 'explore'],
    [s.filtered.filter, 'explore-filtered'],
    [s.emptyFilter, 'explore-empty'],
  ];
  /** setFilter, seen from a frame whose filter is `current`: where each chip's new filter leads. */
  const changeFrom =
    (current: ExploreFilter): FilterChange =>
    (next) => {
      if (sameFilter(next, current)) {
        return undefined;
      }
      const target = drawn.find(([filter]) => sameFilter(filter, next));
      return target === undefined ? undefined : { go: target[1], goHow: 'replace' };
    };

  // While nothing has loaded, a chip leads to the same skeletons or error with that chip on, which
  // the board has no frame for: no links.
  const noFrame: FilterChange = () => undefined;

  // renderItem + ItemSeparatorComponent: the list has no view around its items, and a Gap between
  // each two (none after the last). router.push('/cafe/[slug]'): the board has the story's cafe.
  const items = (cafes: CafeCardModel[]): Child =>
    cafes.map((cafe, index) => [
      index === 0 ? null : Gap(),
      CafeCard({ cafe, ...(cafe.slug === s.cafe.slug ? { go: 'cafe' } : {}) }),
    ]);

  return [
    Phone({
      key: 'explore',
      name: 'Explore',
      route: ROUTE,
      note: 'The first tab, and where the app opens. All six sample cafes in Bengaluru; tapping one opens it.',
      tabs: { active: 'explore' },
      content: List(
        Header({ areas: s.areas, filter: NO_FILTER, change: changeFrom(NO_FILTER) }),
        items(s.cafes),
      ),
    }),

    Phone({
      key: 'explore-filtered',
      name: 'Explore · PlayStation 5 only',
      route: ROUTE,
      note: 'After tapping the "PlayStation 5" chip: the chip turns on, "Everything" turns off, and the list holds only the cafes with that kind of station. Tapping the chip again clears it.',
      tabs: { active: 'explore' },
      content: List(
        Header({
          areas: s.areas,
          filter: s.filtered.filter,
          change: changeFrom(s.filtered.filter),
        }),
        items(s.filtered.cafes),
      ),
    }),

    Phone({
      key: 'explore-loading',
      name: 'Explore · loading',
      route: ROUTE,
      note: 'As the app opens, before the cafes arrive: three placeholder cards. The areas are still on their way too, so "All areas" is the only chip in its row. The same placeholders show after a chip tap while that filter\'s cafes are fetched; a filter fetched in the last few minutes shows its cafes at once.',
      tabs: { active: 'explore' },
      content: List(
        // areas.data ?? []: nothing stands in for the area chips while they load.
        Header({ areas: [], filter: NO_FILTER, change: noFrame }),
        // ListEmptyComponent, cafes.isPending
        box(
          { name: 'skeletons', gap: spacing.md },
          Array.from({ length: SKELETON_COUNT }, () => CafeCardSkeleton()),
        ),
      ),
    }),

    Phone({
      key: 'explore-empty',
      name: 'Explore · no cafes match',
      route: ROUTE,
      note: 'An area and a kind of station that no cafe has together: here "Whitefield" with "PlayStation 5". The area row is drawn scrolled to its end, where the player tapped "Whitefield".',
      tabs: { active: 'explore' },
      content: List(
        Header({
          areas: s.areas,
          filter: s.emptyFilter,
          change: changeFrom(s.emptyFilter),
          areasScrolledToEnd: true,
        }),
        // ListEmptyComponent, neither pending nor failed
        EmptyState({
          title: 'No cafes here yet',
          message: 'Try another area or kind of station. New cafes are being signed up.',
        }),
      ),
    }),

    Phone({
      key: 'explore-error',
      name: 'Explore · could not load',
      route: ROUTE,
      note: 'The app opened and the cafes could not be fetched (no connection, say). The areas failed with them, so their row has only "All areas". "Try again" asks for the cafes once more and the placeholders come back.',
      tabs: { active: 'explore' },
      content: List(
        Header({ areas: [], filter: NO_FILTER, change: noFrame }),
        // ListEmptyComponent, cafes.isError. retry() refetches a query with no data, which puts it
        // back in `pending`: the skeletons.
        ErrorState({
          title: 'Could not load cafes',
          retry: { go: 'explore-loading', goHow: 'replace' },
        }),
      ),
    }),
  ];
}
