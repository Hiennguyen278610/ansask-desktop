import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const location = useLocation();
  
  // Các route yêu cầu layout tĩnh (không cuộn toàn cục)
  const isFixedLayout = 
    location.pathname.endsWith('/new') || 
    location.pathname.endsWith('/edit') || 
    location.pathname.includes('/quiz') ||
    location.pathname.endsWith('/result');

  return (
    <div className="h-screen w-screen overflow-hidden bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7">
      <Sidebar />
      <main className="flex-1 w-full h-full neu-shell rounded-[32px] p-5 sm:p-8 overflow-hidden flex flex-col relative">
        {isFixedLayout ? (
          // Trả về trực tiếp, component con tự quản lý chiều cao (h-full flex-col)
          <Outlet />
        ) : (
          // Bọc trong vùng cuộn cho các trang thông thường
          <div className="flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
