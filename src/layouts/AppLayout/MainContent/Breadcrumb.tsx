import { Fragment } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => m.staticData?.crumb)
    .map((m) => ({
      id: m.id,
      pathname: m.pathname,
      label: m.staticData.crumb!({ loaderData: m.loaderData }),
    }));

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      {crumbs.map((c, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <Fragment key={c.id}>
            {idx > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-subtle)]" />}
            {isLast ? (
              <span className="truncate font-semibold text-[var(--text)]">{c.label}</span>
            ) : (
              <Link
                to={c.pathname}
                className="truncate text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                {c.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
