import { Heart } from 'lucide-react';

export function DonateTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-6 text-center">
      <div className="mb-3 flex items-center gap-2 text-[var(--primary-text)]">
        <Heart className="h-5 w-5" />
        <h3 className="text-base font-bold text-[var(--text)]">Ủng hộ phát triển</h3>
      </div>

      <p className="mb-4 max-w-sm text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
        Cảm ơn bạn đã sử dụng AnsAsk! Nếu thấy hữu ích, bạn có thể quét mã VietQR bên dưới để ủng
        hộ tác giả duy trì và phát triển ứng dụng.
      </p>

      <div className="rounded-[var(--radius-lg)] bg-white p-2.5 shadow-[var(--shadow-elevated)]">
        <img
          src="/ungho.jpeg"
          alt="Mã QR VietQR ủng hộ phát triển AnsAsk"
          className="h-56 w-56 rounded-[var(--radius-md)] object-contain sm:h-60 sm:w-60"
        />
      </div>
    </div>
  );
}
