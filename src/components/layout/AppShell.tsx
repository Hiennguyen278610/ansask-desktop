import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const location = useLocation();
  
  // Các route cần layout cố định (không cuộn container cha, tự cuộn bên trong)
  const isFixedLayout = 
    location.pathname.endsWith('/new') || 
    location.pathname.endsWith('/edit') || 
    location.pathname.includes('/quiz');

  return (
    <div className="h-screen w-screen overflow-hidden bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7">
      <Sidebar />
      <main className="flex-1 w-full h-full neu-shell rounded-[32px] p-5 sm:p-8 overflow-hidden flex flex-col relative">
        {isFixedLayout ? (
          // Editor/Quiz tự quản lý chiều cao và cuộn nội bộ
          <Outlet />
        ) : (
          // Các màn hình khác cuộn toàn bộ nội dung
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
