import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  eyebrow?: string | undefined;
  description?: string | undefined;
  action?: { href: Route; label: string } | undefined;
  children: ReactNode;
}

/** A labelled landmark with a heading row; every content block on the site is one of these. */
export function Section({ id, title, eyebrow, description, action, children }: Props) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="container-x py-12 sm:py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h2
            id={headingId}
            className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {title}
          </h2>
          {description ? <p className="text-muted mt-2">{description}</p> : null}
        </div>
        {action ? (
          <Link href={action.href} className="link-accent">
            {action.label} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
