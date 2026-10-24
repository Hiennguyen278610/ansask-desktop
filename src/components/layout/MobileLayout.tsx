import { Outlet, useLocation, useNavigate } from 'react-router';
import { Home, BookOpen, Upload, Sparkles } from 'lucide-react';

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Ẩn Bottom Nav khi đang làm bài kiểm tra (full màn hình)
  const isQuizActive = location.pathname.includes('/quiz');
  const isImport = location.pathname === '/mobile-import';

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-app text-ink flex flex-col relative">
      {/* Nội dung chính - có padding bottom để không bị Navbar che */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden ${!isQuizActive ? 'pb-20' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {!isQuizActive && (
        <nav className="absolute bottom-0 left-0 w-full h-16 bg-neu border-t border-[var(--border-strong)] flex items-center justify-around z-50">
          <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 w-16 ${location.pathname === '/' ? 'text-emerald-500' : 'text-slate-400'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold">Trang chủ</span>
          </button>
          <button onClick={() => navigate('/subjects')} className={`flex flex-col items-center gap-1 w-16 ${location.pathname.includes('/subjects') ? 'text-emerald-500' : 'text-slate-400'}`}>
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-bold">Môn học</span>
          </button>
          <button onClick={() => navigate('/mobile-import')} className={`flex flex-col items-center gap-1 w-16 ${isImport ? 'text-emerald-500' : 'text-slate-400'}`}>
            <Upload className="w-6 h-6" />
            <span className="text-[10px] font-bold">Nhập đề</span>
          </button>
        </nav>
      )}
    </div>
  );
}
