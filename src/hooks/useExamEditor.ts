import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { examGet, examSave, importParse, type QuestionUpsertReq } from '@/lib/tauri/commands';
import { questionsToJsonString, questionsToTxtString } from '@/features/import/serialize';
import { useUiStore } from '@/stores/uiStore';
import { AppException } from '@/lib/tauri/invoke';

function createEmptyQuestion(): QuestionUpsertReq {
  return {
    ask: 'Câu hỏi mới',
    options: [
      { text: 'Lựa chọn A', isCorrect: false },
      { text: 'Lựa chọn B', isCorrect: true },
      { text: 'Lựa chọn C', isCorrect: false },
      { text: 'Lựa chọn D', isCorrect: false },
    ]
  };
}

export function useExamEditor(examId?: string, subjectId?: string) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionUpsertReq[]>([]);
  const [format, setFormat] = useState<'txt' | 'json'>('txt');
  const [rawText, setRawText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!examId);

  useEffect(() => {
    if (examId) {
      examGet(examId).then(res => {
        setTitle(res.title);
        setQuestions(res.questions);
        setRawText(questionsToTxtString(res.questions));
        setIsLoading(false);
      }).catch((err: Error | AppException) => {
        showToast(`Lỗi tải đề: ${err.message}`);
        navigate(`/subjects/${subjectId}/exams`);
      });
    } else {
      const initial = [createEmptyQuestion()];
      setQuestions(initial);
      setRawText(questionsToTxtString(initial));
      setIsLoading(false);
    }
  }, [examId, subjectId, navigate, showToast]);

  const syncQuestionsToRaw = useCallback((nextQs: QuestionUpsertReq[], nextFormat = format) => {
    setQuestions(nextQs);
    setParseError(null);
    setRawText(nextFormat === 'json' ? questionsToJsonString(nextQs) : questionsToTxtString(nextQs));
  }, [format]);

  const handleRawChange = async (val: string) => {
    setRawText(val);
    try {
      const res = await importParse(format, val);
      setQuestions(res.questions);
      if (res.issues && res.issues.length > 0) {
        setParseError(res.issues[0].message);
      } else {
        setParseError(null);
      }
    } catch (err: unknown) {
      setParseError((err as Error).message || 'Cú pháp chưa hợp lệ...');
    }
  };

  const handleSwitchFormat = (target: 'txt' | 'json') => {
    setFormat(target);
    setParseError(null);
    setRawText(target === 'json' ? questionsToJsonString(questions) : questionsToTxtString(questions));
  };

  const updateQuestion = (idx: number, updatedQ: QuestionUpsertReq) => {
    const next = [...questions];
    next[idx] = updatedQ;
    syncQuestionsToRaw(next);
  };

  const deleteQuestion = (idx: number) => {
    const next = questions.filter((_, i) => i !== idx);
    syncQuestionsToRaw(next);
  };

  const insertQuestion = (idx: number) => {
    const next = [...questions];
    next.splice(idx, 0, createEmptyQuestion());
    syncQuestionsToRaw(next);
  };

  const save = async () => {
    if (!subjectId) return;
    if (parseError) {
      showToast('Vui lòng sửa lỗi cú pháp trước khi lưu!');
      return;
    }
    try {
      const finalTitle = title.trim() || 'Chưa có tiêu đề';
      await examSave({
        id: examId,
        subjectId,
        title: finalTitle,
        questions: questions
      });
      showToast(`Đã lưu bộ đề "${finalTitle}"`);
      qc.invalidateQueries({ queryKey: ['exams', subjectId] });
      navigate(`/subjects/${subjectId}/exams`);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Lỗi lưu bộ đề');
    }
  };

  return {
    title, setTitle,
    questions, updateQuestion, deleteQuestion, insertQuestion,
    format, handleSwitchFormat,
    rawText, handleRawChange,
    parseError,
    save,
    isLoading
  };
}
