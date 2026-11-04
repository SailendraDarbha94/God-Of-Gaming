import type { Area } from '@gog/domain';
import Link from 'next/link';

import { paths } from '@/lib/paths';

export function AreaLinks({ areas }: { areas: Area[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {areas.map((area) => (
        <li key={area.id}>
          <Link href={paths.area(area.slug)} className="chip chip-link">
            {area.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
