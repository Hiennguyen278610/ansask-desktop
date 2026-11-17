import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <MainContent />
    </div>
  );
}
