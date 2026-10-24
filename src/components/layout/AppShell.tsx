import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

/**
 * AppShell — sidebar + main layout (design-system §3.1).
 * KHÔNG chứa ToastHost: OVL-01 mount ở App root (design-system §3.6)
 * để không bị nhân bản khi có thêm layout khác (vd. Quiz fullscreen).
 * BreadcrumbHeader là component per-screen (design-system §5, SCREEN-02..05).
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7">
      <Sidebar />
      <main className="flex-1 neu-shell rounded-[32px] p-5 sm:p-8 overflow-x-hidden flex flex-col gap-6">
        <Outlet />
      </main>
    </div>
  );
}
