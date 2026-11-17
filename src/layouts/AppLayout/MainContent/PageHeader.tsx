import { Breadcrumb } from './Breadcrumb';

export function PageHeader({ slotRef }: { slotRef: (el: HTMLElement | null) => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-[var(--surface)] px-6">
      <Breadcrumb />
      <div ref={slotRef} className="flex shrink-0 items-center gap-2" />
    </header>
  );
}
