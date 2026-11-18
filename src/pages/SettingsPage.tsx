import { Link } from '@tanstack/react-router';
import { ChevronRight, Heart, Trash2 } from 'lucide-react';
import { GeneralTab } from '@/features/settings/components/GeneralTab';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 sm:p-5">
        <GeneralTab />
      </section>

      <section className="divide-y rounded-[var(--radius-lg)] bg-[var(--surface)] overflow-hidden">
        <Link
          to="/settings/trash"
          className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--destroy-soft)] text-[var(--destroy-text)]">
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text)]">Thùng rác</p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                Khôi phục hoặc xóa vĩnh viễn môn học, bộ đề
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-subtle)]" />
        </Link>

        <Link
          to="/settings/donate"
          className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary-text)]">
              <Heart className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text)]">Ủng hộ</p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                Quét mã VietQR ủng hộ phát triển AnsAsk
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-subtle)]" />
        </Link>
      </section>
    </div>
  );
}
