import { Heart } from 'lucide-react';

export function DonateTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <Heart className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text)]">Ủng hộ phát triển</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
        Cảm ơn bạn đã sử dụng AnsAsk! Thông tin ủng hộ sẽ được cập nhật trong phiên bản sắp tới.
      </p>
    </div>
  );
}
