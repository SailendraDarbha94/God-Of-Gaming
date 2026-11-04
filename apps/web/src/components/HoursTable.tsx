import type { OpeningHours } from '@gog/domain';

import { formatHoursForDisplay } from '@/lib/format';

export function HoursTable({ hours }: { hours: OpeningHours[] }) {
  const rows = formatHoursForDisplay(hours);
  if (rows.length === 0) {
    return <p className="text-muted text-sm">Opening hours are not listed yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Opening hours, Indian Standard Time</caption>
      <tbody className="divide-border divide-y">
        {rows.map((row) => (
          <tr key={row.days}>
            <th scope="row" className="py-2 pr-4 text-left font-medium">
              {row.days}
            </th>
            <td
              className={row.hours === 'Closed' ? 'text-muted py-2 text-right' : 'py-2 text-right'}
            >
              {row.hours}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
