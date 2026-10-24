import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="min-h-screen bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7 md:items-start">
      <Sidebar />
      <main className="flex-1 w-full neu-shell rounded-[32px] p-5 sm:p-8 overflow-x-hidden flex flex-col gap-6 min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-3rem)]">
        <Outlet />
      </main>
    </div>
  );
}
