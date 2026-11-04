import type { Promotion } from '@gog/domain';
import Image from 'next/image';
import Link from 'next/link';

import { formatPromotionWindow } from '@/lib/format';
import { paths } from '@/lib/paths';

export function PromoCard({ promotion }: { promotion: Promotion }) {
  return (
    <article className="card hover:border-muted relative flex flex-col transition-colors">
      {promotion.imageUrl ? (
        <div className="bg-surface-2 relative aspect-[2/1]">
          <Image
            src={promotion.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {promotion.isFeatured ? <p className="eyebrow">Featured</p> : null}
        <h3 className="font-display text-lg font-semibold">
          <Link href={paths.event(promotion.slug)} className="after:absolute after:inset-0">
            {promotion.title}
          </Link>
        </h3>
        <p className="text-muted text-sm">
          {formatPromotionWindow(promotion.startsAt, promotion.endsAt)}
        </p>
        {promotion.cafe ? <p className="text-sm font-medium">{promotion.cafe.name}</p> : null}
        <p className="text-sm">{promotion.summary}</p>
      </div>
    </article>
  );
}
