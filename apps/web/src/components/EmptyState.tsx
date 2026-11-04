import type { Route } from 'next';
import Link from 'next/link';

interface Props {
  title: string;
  message: string;
  action?: { href: Route; label: string } | undefined;
}

/** Calm "nothing here" block, also used when a catalog read fails (05-web.md, Data). */
export function EmptyState({ title, message, action }: Props) {
  return (
    <div role="status" className="card px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="text-muted mx-auto mt-2 max-w-md">{message}</p>
      {action ? (
        <Link href={action.href} className="btn btn-secondary mt-6">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
