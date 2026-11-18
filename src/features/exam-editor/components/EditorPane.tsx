import { useMemo, useState } from 'react';
import { json } from '@codemirror/lang-json';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useSettingsStore } from '@/features/settings/store/settings.store';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';
import { useEditorStore } from '../store/editor.store';

export function EditorPane() {
  const format = useEditorStore((s) => s.format);
  const editorText = useEditorStore((s) => s.editorText);
  const parseErrors = useEditorStore((s) => s.parseErrors);
  const setFormat = useEditorStore((s) => s.setFormat);
  const setEditorText = useEditorStore((s) => s.setEditorText);
  const themeSetting = useSettingsStore((s) => s.theme);
  const [errorsOpen, setErrorsOpen] = useState(false);

  const isDark =
    themeSetting === 'dark' ||
    (themeSetting === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const errorLineCount = useMemo(() => {
    const seen = new Set<string>();
    parseErrors.forEach((err, i) => {
      if (err.line !== undefined) {
        seen.add(`line:${err.line}`);
      } else if (err.path !== undefined) {
        seen.add(`path:${err.path}`);
      } else {
        seen.add(`idx:${i}`);
      }
    });
    return seen.size;
  }, [parseErrors]);

  const handleSwitch = (next: 'text' | 'json') => {
    if (next === format) return;
    const hadErrors = setFormat(next);
    if (hadErrors) {
      toast.warning('Hãy sửa lỗi cú pháp trước khi đổi định dạng.');
    }
  };

  const extensions = useMemo(
    () => (format === 'json' ? [EditorView.lineWrapping, json()] : [EditorView.lineWrapping]),
    [format],
  );

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[var(--surface)]">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-semibold text-[var(--text)]">editor</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={errorLineCount === 0}
            onClick={() => setErrorsOpen(true)}
            aria-label={
              errorLineCount > 0
                ? `${errorLineCount} dòng bị lỗi, nhấn để xem chi tiết`
                : 'Không có lỗi cú pháp'
            }
            title={
              errorLineCount > 0
                ? `${errorLineCount} dòng bị lỗi — nhấn để xem chi tiết`
                : 'Không có lỗi cú pháp'
            }
            className={cn(
              'relative inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-1',
              errorLineCount > 0
                ? 'text-[var(--warning)] hover:bg-[var(--surface-hover)] cursor-pointer'
                : 'text-[var(--text-subtle)] opacity-50 cursor-default',
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            {errorLineCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sidebar-active)] px-1 text-[10px] font-bold leading-none text-[var(--sidebar-active-foreground)]">
                {errorLineCount}
              </span>
            )}
          </button>

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
      </div>

      <div className="min-h-0 flex-1 overflow-auto text-sm">
        <CodeMirror
          value={editorText}
          height="100%"
          theme={isDark ? 'dark' : 'light'}
          extensions={extensions}
          onChange={(val) => setEditorText(val)}
          className="h-full"
        />
      </div>

      <Dialog open={errorsOpen} onOpenChange={setErrorsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
              <span>Chi tiết lỗi cú pháp ({errorLineCount} dòng)</span>
            </DialogTitle>
            <DialogDescription>
              Kiểm tra và chỉnh sửa các dòng dưới đây trong trình soạn thảo.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {parseErrors.map((err, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-md)] bg-[var(--destroy-soft)] px-3 py-2 text-xs text-[var(--destroy-text)]"
              >
                {err.line !== undefined && <span className="font-semibold">Dòng {err.line}: </span>}
                {err.path !== undefined && <span className="font-semibold">{err.path}: </span>}
                <span>{err.message}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setErrorsOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
