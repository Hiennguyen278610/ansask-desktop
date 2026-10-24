import { useState } from 'react';
import { Sparkles, Copy, ExternalLink, Check, BookOpen, Braces } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { PROMPT_JSON, PROMPT_TXT } from './prompts';

export function GuideScreen() {
  const showToast = useUiStore(s => s.showToast);
  const [copiedTab, setCopiedTab] = useState<'json' | 'txt' | null>(null);

  const handleCopy = async (text: string, type: 'json' | 'txt') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTab(type);
      showToast(`Đã sao chép Prompt ${type.toUpperCase()}!`);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      showToast('Lỗi khi sao chép, vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Header */}
      <section className="neu-card rounded-[26px] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl neu-pill flex items-center justify-center text-ink-strong">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink-strong">Hướng dẫn Tạo Bộ Đề Tự Động với AI</h2>
            <p className="text-xs text-slate-400">Chỉ mất 30 giây để biến file PDF/Word/Slide bài giảng thành bộ đề trắc nghiệm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="neu-card-inset p-4 rounded-2xl space-y-2">
            <span className="neu-pill px-2.5 py-1 rounded-lg text-xs font-bold">Bước 1 • Truy cập AI</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              Mở các nền tảng AI hỗ trợ đọc tài liệu như{' '}
              <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="font-bold text-ink underline inline-flex items-center gap-0.5 hover:text-blue-600">
                Google Gemini <ExternalLink className="w-3 h-3" />
              </a>,{' '}
              <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="font-bold text-ink underline inline-flex items-center gap-0.5 hover:text-blue-600">
                ChatGPT <ExternalLink className="w-3 h-3" />
              </a>{' '}
              hoặc{' '}
              <a href="https://claude.ai" target="_blank" rel="noreferrer" className="font-bold text-ink underline inline-flex items-center gap-0.5 hover:text-blue-600">
                Claude AI <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
          </div>

          <div className="neu-card-inset p-4 rounded-2xl space-y-2">
            <span className="neu-pill px-2.5 py-1 rounded-lg text-xs font-bold">Bước 2 • Đính kèm File</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              Nhấn biểu tượng dấu cộng <strong>(+)</strong> trên khung chat của AI để{' '}
              <strong>đính kèm file tài liệu</strong> (PDF, DOCX, TXT hoặc ảnh chụp đề cương).
            </p>
          </div>

          <div className="neu-card-inset p-4 rounded-2xl space-y-2">
            <span className="neu-pill px-2.5 py-1 rounded-lg text-xs font-bold">Bước 3 • Dán Prompt & Nhập đề</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              Chọn định dạng bạn muốn (JSON hoặc TXT) bên dưới, bấm <strong>Sao chép</strong>, dán vào khung chat AI. Sau đó copy kết quả dán vào tab Editor của bộ đề tương ứng.
            </p>
          </div>
        </div>
      </section>

      {/* Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột JSON */}
        <section className="neu-card rounded-[26px] p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-ink-strong flex items-center gap-2">
                <Braces className="w-4 h-4" /> Định dạng JSON
              </h3>
              <p className="text-xs text-slate-400">Khuyên dùng cho các AI hiện đại (Gemini, GPT-4o)</p>
            </div>
            <button
              onClick={() => handleCopy(PROMPT_JSON, 'json')}
              className="neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0"
            >
              {copiedTab === 'json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedTab === 'json' ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          <pre className="flex-1 neu-card-inset p-4 rounded-2xl text-xs font-mono text-ink whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {PROMPT_JSON}
          </pre>
        </section>

        {/* Cột TXT */}
        <section className="neu-card rounded-[26px] p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-ink-strong flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Định dạng TXT
              </h3>
              <p className="text-xs text-slate-400">Phù hợp cho AI trả kết quả nhanh, ít token</p>
            </div>
            <button
              onClick={() => handleCopy(PROMPT_TXT, 'txt')}
              className="neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0"
            >
              {copiedTab === 'txt' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedTab === 'txt' ? 'Đã chép' : 'Sao chép'}
            </button>
          </div>
          <pre className="flex-1 neu-card-inset p-4 rounded-2xl text-xs font-mono text-ink whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {PROMPT_TXT}
          </pre>
        </section>
      </div>
    </div>
  );
}
