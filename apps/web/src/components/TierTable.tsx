import type { StationTier } from '@gog/domain';

import { formatHourlyRate, formatSpecs, stationKindLabel } from '@/lib/format';

/** `labelledBy` names the heading above the table; the scroll region needs it to be focusable with a name. */
export function TierTable({ tiers, labelledBy }: { tiers: StationTier[]; labelledBy: string }) {
  const rows = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    // At 360 px the table scrolls sideways; a focusable, named region keeps the Stations and Per
    // hour columns reachable from the keyboard (axe: scrollable-region-focusable).
    <div className="card overflow-x-auto" tabIndex={0} role="region" aria-labelledby={labelledBy}>
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">Station tiers with prices per hour</caption>
        <thead className="bg-surface-2 text-muted text-xs tracking-wide uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Tier
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Kind
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Specs
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Stations
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Per hour
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((tier) => (
            <tr key={tier.id}>
              <th scope="row" className="px-4 py-3 font-semibold">
                {tier.name}
                {tier.description ? (
                  <span className="text-muted block text-xs font-normal">{tier.description}</span>
                ) : null}
              </th>
              <td className="px-4 py-3">{stationKindLabel(tier.kind)}</td>
              <td className="text-muted px-4 py-3">{formatSpecs(tier.specs) || '—'}</td>
              <td className="px-4 py-3 text-right tabular-nums">{tier.stationCount}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                {formatHourlyRate(tier.hourlyRatePaise)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
