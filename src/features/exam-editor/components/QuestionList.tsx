import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { List } from 'lucide-react';
import { IndexGridDialog } from '@/shared/components/data/IndexGridDialog';
import { Button } from '@/shared/components/ui/button';
import { useEditorStore } from '../store/editor.store';
import { AddQuestionGap } from './AddQuestionGap';
import { QuestionBlock } from './QuestionBlock';

export interface QuestionListHandle {
  scrollToQuestion: (index: number) => void;
}

export const QuestionList = forwardRef<QuestionListHandle>((_, ref) => {
  const questions = useEditorStore((s) => s.draft.questions);
  const addQuestion = useEditorStore((s) => s.addQuestion);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [gridOpen, setGridOpen] = useState(false);

  const v = useVirtualizer({
    count: questions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 260,
    overscan: 4,
    getItemKey: (i) => questions[i]?.uid ?? i,
  });

  const scrollToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    v.scrollToIndex(index, { align: 'start' });
    const targetUid = questions[index].uid;
    requestAnimationFrame(() => {
      const el = scrollRef.current?.querySelector<HTMLTextAreaElement>(
        `textarea[data-question-uid="${targetUid}"]`,
      );
      el?.focus();
    });
  };

  useImperativeHandle(ref, () => ({ scrollToQuestion }));

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <div className="flex h-11 shrink-0 items-center justify-between bg-[var(--surface)] px-4">
        <span className="text-sm font-semibold text-[var(--text)]">Danh sách câu hỏi</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setGridOpen(true)}
          title="Danh sách câu hỏi"
        >
          <List className="h-3.5 w-3.5" />
          <span>{questions.length} câu</span>
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        {questions.length === 0 ? (
          <AddQuestionGap onAdd={() => addQuestion()} alwaysVisible />
        ) : (
          <>
            <div style={{ height: v.getTotalSize(), position: 'relative' }}>
              {v.getVirtualItems().map((row) => {
                const q = questions[row.index];
                if (!q) return null;
                return (
                  <div
                    key={row.key}
                    data-index={row.index}
                    ref={v.measureElement}
                    className="absolute left-0 top-0 w-full"
                    style={{ transform: `translateY(${row.start}px)` }}
                  >
                    <QuestionBlock question={q} index={row.index} />
                    {row.index < questions.length - 1 && (
                      <AddQuestionGap onAdd={() => addQuestion(row.index)} />
                    )}
                  </div>
                );
              })}
            </div>
            <AddQuestionGap onAdd={() => addQuestion()} alwaysVisible />
          </>
        )}
      </div>

      <IndexGridDialog
        open={gridOpen}
        onOpenChange={setGridOpen}
        count={questions.length}
        onSelect={scrollToQuestion}
      />
    </section>
  );
});
QuestionList.displayName = 'QuestionList';
