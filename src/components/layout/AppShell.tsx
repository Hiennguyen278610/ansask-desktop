import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { MobileLayout } from './MobileLayout';
import { useEffect } from 'react';

export function AppShell() {
  const location = useLocation();
  
  // Phát hiện Mobile (đơn giản dựa vào user agent hoặc kích thước)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  useEffect(() => {
    // Gắn class vào thẻ html để CSS tắt shadow
    document.documentElement.classList.toggle('is-mobile', isMobile);
  }, [isMobile]);

  if (isMobile) {
    return <MobileLayout />;
  }

  // Desktop Layout (Giữ nguyên)
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
          <Outlet />
        ) : (
          <div className="flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
