import type { CafeImage } from '@gog/domain';
import Image from 'next/image';

export function Gallery({ images, cafeName }: { images: CafeImage[]; cafeName: string }) {
  const [cover, ...rest] = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  if (!cover) {
    return (
      <div className="card text-muted grid aspect-[3/2] place-items-center text-sm">
        No photos of {cafeName} yet
      </div>
    );
  }
  const thumbnails = rest.slice(0, 2);
  return (
    <div className="grid gap-2 sm:grid-cols-3 sm:grid-rows-2">
      <div className="bg-surface-2 relative aspect-[3/2] overflow-hidden rounded-lg sm:col-span-2 sm:row-span-2 sm:aspect-auto">
        <Image
          src={cover.url}
          alt={cover.alt || cafeName}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>
      {thumbnails.map((image) => (
        <div
          key={image.id}
          className="bg-surface-2 relative hidden aspect-[3/2] overflow-hidden rounded-lg sm:block"
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 20vw, 33vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
