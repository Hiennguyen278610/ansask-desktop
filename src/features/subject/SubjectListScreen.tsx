import { BreadcrumbHeader } from '@/components/layout/BreadcrumbHeader';
import { useUiStore } from '@/stores/uiStore';

export function SubjectListScreen() {
  const showToast = useUiStore((s) => s.showToast);
  return (
    <div className="space-y-5">
      <BreadcrumbHeader>
        <span>root</span>
      </BreadcrumbHeader>
      <div className="neu-card rounded-[26px] p-8 text-center space-y-3">
        <p className="text-sm text-slate-500">Sprint 01 sẽ triển khai CRUD môn học.</p>
        <button
          onClick={() => showToast('Toast hạ tầng đã sẵn sàng ✅')}
          className="neu-dark-btn px-5 py-2.5 rounded-xl text-sm font-bold"
        >
          Test toast
        </button>
      </div>
    </div>
  );
}
