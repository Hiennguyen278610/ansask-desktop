import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { toast } from 'sonner';
import { useSettingsStore } from '@/features/settings/store/settings.store';
import { cn } from '@/shared/lib/cn';
import { useEditorStore } from '../store/editor.store';

export function EditorPane() {
  const format = useEditorStore((s) => s.format);
  const editorText = useEditorStore((s) => s.editorText);
  const parseErrors = useEditorStore((s) => s.parseErrors);
  const setFormat = useEditorStore((s) => s.setFormat);
  const setEditorText = useEditorStore((s) => s.setEditorText);
  const themeSetting = useSettingsStore((s) => s.theme);

  const isDark =
    themeSetting === 'dark' ||
    (themeSetting === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleSwitch = (next: 'text' | 'json') => {
    if (next === format) return;
    const hadErrors = setFormat(next);
    if (hadErrors) {
      toast.warning('Hãy sửa lỗi cú pháp trước khi đổi định dạng.');
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[var(--surface)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-semibold text-[var(--text)]">editor</span>
        <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitch('text')}
            className={cn(
              'rounded-[var(--radius-sm)] px-2.5 py-1 transition-colors cursor-pointer',
              format === 'text'
                ? 'bg-[var(--surface)] text-[var(--text)]'
                : 'text-[var(--text-muted)]',
            )}
          >
            TEXT
          </button>
          <button
            type="button"
            onClick={() => handleSwitch('json')}
            className={cn(
              'rounded-[var(--radius-sm)] px-2.5 py-1 transition-colors cursor-pointer',
              format === 'json'
                ? 'bg-[var(--surface)] text-[var(--text)]'
                : 'text-[var(--text-muted)]',
            )}
          >
            JSON
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto text-sm">
        <CodeMirror
          value={editorText}
          height="100%"
          theme={isDark ? 'dark' : 'light'}
          extensions={format === 'json' ? [json()] : []}
          onChange={(val) => setEditorText(val)}
          className="h-full"
        />
      </div>

      {parseErrors.length > 0 && (
        <div className="max-h-36 shrink-0 space-y-1 overflow-y-auto bg-[var(--destroy-soft)] p-3 text-xs text-[var(--destroy-text)]">
          {parseErrors.map((err, i) => (
            <div key={i}>
              {err.line !== undefined && <span className="font-semibold">Dòng {err.line}: </span>}
              {err.path !== undefined && <span className="font-semibold">{err.path}: </span>}
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
