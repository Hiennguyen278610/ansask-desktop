import { Breadcrumb } from './Breadcrumb';

export function PageHeader({ slotRef }: { slotRef: (el: HTMLElement | null) => void }) {
  return (
    <header className="flex shrink-0 flex-col gap-2.5 bg-[var(--surface)] px-4 pt-10 pb-3 md:h-14 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-0">
      <Breadcrumb />
      <div
        ref={slotRef}
        className="flex w-full flex-wrap items-center gap-2 empty:hidden md:w-auto md:shrink-0 md:justify-end"
      />
    </header>
  );
}
