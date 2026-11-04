import { amenityLabel } from '@/lib/format';

export function Amenities({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Amenities">
      {amenities.map((amenity) => (
        <li key={amenity} className="chip">
          {amenityLabel(amenity)}
        </li>
      ))}
    </ul>
  );
}
