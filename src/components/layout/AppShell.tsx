import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7">
      <Sidebar />
      <main className="flex-1 w-full h-full neu-shell rounded-[32px] p-5 sm:p-8 overflow-hidden flex flex-col relative">
        {/* Vùng bọc nội dung: chỉ phần này được phép cuộn */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
