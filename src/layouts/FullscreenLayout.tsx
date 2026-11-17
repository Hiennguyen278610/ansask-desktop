import { Outlet } from '@tanstack/react-router';

export function FullscreenLayout() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--bg)]">
      <Outlet />
    </div>
  );
}
