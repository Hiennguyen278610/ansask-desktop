import { Fragment } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Breadcrumb() {
  const matches = useMatches();
  const crumbs = matches
    .filter((m) => m.staticData?.crumb)
    .map((m) => ({
      id: m.id,
      pathname: m.pathname,
      label: m.staticData.crumb!({ loaderData: m.loaderData }),
    }));

  const parentCrumb = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
  const currentCrumb = crumbs[crumbs.length - 1];

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-base">
      {/* Mobile compact header: back button + current page title */}
      <div className="flex min-w-0 items-center gap-1.5 md:hidden">
        {parentCrumb && (
          <Link
            to={parentCrumb.pathname}
            aria-label={`Quay lại ${parentCrumb.label}`}
            className="-ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        {currentCrumb && (
          <span className="truncate text-lg font-bold text-[var(--text)]">
            {currentCrumb.label}
          </span>
        )}
      </div>

      {/* Desktop full breadcrumb */}
      <div className="hidden min-w-0 items-center gap-1.5 md:flex">
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
      </div>
    </nav>
  );
}
