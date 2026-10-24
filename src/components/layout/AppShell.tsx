import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const location = useLocation();
  
  // Các route cần layout cố định (không cuộn container cha)
  const isFixedLayout = 
    location.pathname.endsWith('/new') || 
    location.pathname.endsWith('/edit') || 
    location.pathname.includes('/quiz');

  return (
    <div className="h-screen w-screen overflow-hidden bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7">
      <Sidebar />
      <main className="flex-1 w-full h-full neu-shell rounded-[32px] p-5 sm:p-8 overflow-hidden flex flex-col relative min-h-0">
        {isFixedLayout ? (
          <Outlet />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 -mr-2">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
