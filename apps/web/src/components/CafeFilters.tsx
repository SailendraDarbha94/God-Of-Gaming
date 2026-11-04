import type { Area, StationKind } from '@gog/domain';
import type { Route } from 'next';
import Link from 'next/link';

import { stationKindLabel, stationKinds } from '@/lib/format';
import { paths } from '@/lib/paths';

/** The filters a `/cafes` URL selected, as slugs; not @gog/data's `CafeFilter`, which is the request. */
export interface CafeFilterSelection {
  area?: string | undefined;
  kind?: StationKind | undefined;
}

interface Option {
  href: Route;
  label: string;
  selected: boolean;
}

function FilterGroup({ label, options }: { label: string; options: Option[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-muted mr-1 text-xs font-semibold tracking-wide uppercase">{label}</span>
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.selected ? 'page' : undefined}
          className={`chip chip-link ${option.selected ? 'chip-selected' : ''}`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

/** Filters are plain links, so the page needs no client JavaScript (05-web.md, Routes). */
export function CafeFilters({ areas, selected }: { areas: Area[]; selected: CafeFilterSelection }) {
  const areaOptions: Option[] = [
    {
      href: paths.cafesFiltered({ kind: selected.kind }),
      label: 'All areas',
      selected: selected.area === undefined,
    },
    ...areas.map((area) => ({
      href: paths.cafesFiltered({ area: area.slug, kind: selected.kind }),
      label: area.name,
      selected: selected.area === area.slug,
    })),
  ];
  const kindOptions: Option[] = [
    {
      href: paths.cafesFiltered({ area: selected.area }),
      label: 'All stations',
      selected: selected.kind === undefined,
    },
    ...stationKinds().map((kind) => ({
      href: paths.cafesFiltered({ area: selected.area, kind }),
      label: stationKindLabel(kind),
      selected: selected.kind === kind,
    })),
  ];
  return (
    <div className="flex flex-col gap-3">
      <FilterGroup label="Area" options={areaOptions} />
      <FilterGroup label="Station" options={kindOptions} />
    </div>
  );
}
