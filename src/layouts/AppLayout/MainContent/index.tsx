import { useState } from 'react';
import { Outlet, useMatches } from '@tanstack/react-router';
import { cn } from '@/shared/lib/cn';
import { HeaderSlotContext } from './HeaderSlotContext';
import { PageHeader } from './PageHeader';
import { ScrollContext } from './ScrollContext';

export function MainContent() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const custom = useMatches().some((m) => m.staticData?.headerMode === 'custom');

  return (
    <HeaderSlotContext.Provider value={slot}>
      <ScrollContext.Provider value={scrollEl}>
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
          {!custom && <PageHeader slotRef={setSlot} />}
          <div
            ref={setScrollEl}
            className={cn(
              'min-h-0 flex-1',
              custom ? 'overflow-hidden' : 'overflow-y-auto p-4 pb-24 md:p-6 md:pb-6',
            )}
          >
            <Outlet />
          </div>
        </main>
      </ScrollContext.Provider>
    </HeaderSlotContext.Provider>
  );
}
