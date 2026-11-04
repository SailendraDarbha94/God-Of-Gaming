import { site } from '@/config/site';
import { bookingLimits } from '@/lib/format';

const STEPS = [
  {
    title: 'Find a cafe',
    text: `Browse cafes across ${site.city.name} by area and by what they have: PC tiers, PS5, Xbox, VR, sim rigs.`,
  },
  {
    title: 'Hold seats for your squad',
    text: `Pick a tier, a time and how many of you are coming. The app holds the stations for ${bookingLimits.holdMinutes} minutes.`,
  },
  {
    title: 'Confirm',
    text: 'Check the price per hour and the total, then confirm. The cafe sees your booking straight away.',
  },
  {
    title: 'Play',
    text: 'Walk in, sit down together, play. No queueing for free machines.',
  },
] as const;

export function HowItWorks() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="card p-5">
          <p className="font-display text-accent text-sm font-semibold" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="font-display mt-2 text-lg font-semibold">{step.title}</h3>
          <p className="text-muted mt-2 text-sm">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
