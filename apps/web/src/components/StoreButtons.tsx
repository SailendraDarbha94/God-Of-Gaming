import type { StoreLink } from '@/lib/store-links';

interface Props {
  stores: StoreLink[];
}

/**
 * Store buttons as styled links; the official badge artwork replaces them later. A store without a
 * URL yet renders as a disabled "Coming soon" so the layout is the same before and after launch.
 */
export function StoreButtons({ stores }: Props) {
  return (
    <ul className="flex flex-wrap gap-3" aria-label="Get the app">
      {stores.map((store) => (
        <li key={store.platform}>
          {store.url ? (
            <a
              href={store.url}
              rel="noopener noreferrer"
              className="btn btn-store"
              aria-label={`${store.prefix} ${store.store}`}
            >
              <span className="flex flex-col leading-tight">
                <span className="text-muted text-[0.7rem] font-medium tracking-wide uppercase">
                  {store.prefix}
                </span>
                <span className="text-base font-semibold">{store.store}</span>
              </span>
            </a>
          ) : (
            <span className="btn btn-store btn-disabled" aria-disabled="true">
              <span className="flex flex-col leading-tight">
                <span className="text-[0.7rem] font-medium tracking-wide uppercase">
                  {store.store}
                </span>
                <span className="text-base font-semibold">Coming soon</span>
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
