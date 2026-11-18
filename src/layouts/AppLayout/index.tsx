import { MainContent } from './MainContent';
import { MobileBottomNav } from './MobileBottomNav';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <MainContent />
      <MobileBottomNav />
    </div>
  );
}
