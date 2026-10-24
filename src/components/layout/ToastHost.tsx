import { Sparkles } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 neu-dark-btn px-5 py-3 rounded-2xl flex items-center gap-2.5 text-sm font-medium animate-fade-in"
    >
      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{toast}</span>
    </div>
  );
}
