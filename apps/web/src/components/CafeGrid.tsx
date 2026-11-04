import type { CafeCard as CafeCardData } from '@gog/domain';

import { CafeCard } from '@/components/CafeCard';

export function CafeGrid({ cafes }: { cafes: CafeCardData[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cafes.map((cafe) => (
        <li key={cafe.id} className="flex">
          <CafeCard cafe={cafe} />
        </li>
      ))}
    </ul>
  );
}
