import { Plus, Trash2 } from 'lucide-react';
import type { DraftQuestion } from '@/domain/types';
import { AutoGrowTextarea } from '@/shared/components/form/AutoGrowTextarea';
import { Button } from '@/shared/components/ui/button';
import { useEditorStore } from '../store/editor.store';
import { OptionRow } from './OptionRow';

interface QuestionBlockProps {
  question: DraftQuestion;
  index: number;
}

export function QuestionBlock({ question, index }: QuestionBlockProps) {
  const setQuestionContent = useEditorStore((s) => s.setQuestionContent);
  const removeQuestion = useEditorStore((s) => s.removeQuestion);
  const addOption = useEditorStore((s) => s.addOption);
  const removeOption = useEditorStore((s) => s.removeOption);
  const setOptionContent = useEditorStore((s) => s.setOptionContent);
  const setCorrect = useEditorStore((s) => s.setCorrect);

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 shadow-[var(--shadow-elevated)]">
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">
          Câu {index + 1}
        </span>
        <AutoGrowTextarea
          data-question-uid={question.uid}
          value={question.content}
          onChange={(e) => setQuestionContent(question.uid, e.target.value)}
          placeholder="Nội dung câu hỏi"
          className="flex-1 font-medium"
        />
        <button
          type="button"
          onClick={() => removeQuestion(question.uid)}
          title="Xóa câu hỏi"
          className="mt-1 shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--destroy-soft)] hover:text-[var(--destroy-text)] cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {question.options.map((opt, oi) => (
          <OptionRow
            key={opt.uid}
            questionUid={question.uid}
            option={opt}
            index={oi}
            canRemove={question.options.length > 1}
            onSelectCorrect={() => setCorrect(question.uid, opt.uid)}
            onChangeContent={(v) => setOptionContent(question.uid, opt.uid, v)}
            onRemove={() => removeOption(question.uid, opt.uid)}
          />
        ))}
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={question.options.length >= 10}
          onClick={() => addOption(question.uid)}
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm lựa chọn
        </Button>
      </div>
    </div>
  );
}
