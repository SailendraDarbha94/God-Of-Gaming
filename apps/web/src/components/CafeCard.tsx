import type { CafeCard as CafeCardData } from '@gog/domain';
import Image from 'next/image';
import Link from 'next/link';

import { formatFromRate, formatStationCount, stationKindLabel } from '@/lib/format';
import { paths } from '@/lib/paths';

export function CafeCard({ cafe }: { cafe: CafeCardData }) {
  return (
    <article className="card hover:border-muted relative flex flex-col transition-colors">
      <div className="bg-surface-2 relative aspect-[3/2]">
        {cafe.coverImageUrl ? (
          <Image
            src={cafe.coverImageUrl}
            alt={`${cafe.name}, ${cafe.area.name}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted grid h-full place-items-center text-sm">No photo yet</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg font-semibold">
            <Link href={paths.cafe(cafe.slug)} className="after:absolute after:inset-0">
              {cafe.name}
            </Link>
          </h3>
          <p className="text-muted text-sm">
            {cafe.area.name} · {cafe.city.name}
          </p>
        </div>
        {cafe.kinds.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Station kinds">
            {cafe.kinds.map((kind) => (
              <li key={kind} className="chip">
                {stationKindLabel(kind)}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-auto flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold">{formatFromRate(cafe.fromHourlyRatePaise)}</span>
          <span className="text-muted">{formatStationCount(cafe.stationCount)}</span>
        </p>
      </div>
    </article>
  );
}
