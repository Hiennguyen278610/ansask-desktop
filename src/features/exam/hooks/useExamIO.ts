import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { toast } from 'sonner';
import {
  parseJson,
  parseText,
  toExamInput,
  toJson,
  toText,
  type ParseError,
} from '@/domain/exam-format';
import type { Id } from '@/domain/types';
import { examKeys } from '@/services/exam/keys';
import { useCreateExam } from '@/services/exam/queries';
import { questionService } from '@/services/question/service';

export interface ImportFileError {
  fileName: string;
  errors: ParseError[];
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? 'Bộ đề mới';
}

function extractTitle(filePath: string): string {
  return getFileName(filePath).replace(/\.(txt|json)$/i, '') || 'Bộ đề mới';
}

export function useExamIO(subjectId: Id) {
  const qc = useQueryClient();
  const createExam = useCreateExam(subjectId);
  const [importErrors, setImportErrors] = useState<ImportFileError[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const importExam = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Đề', extensions: ['txt', 'json'] }],
    });
    if (!selected) return;

    const paths = Array.isArray(selected) ? selected : [selected];
    if (paths.length === 0) return;

    setIsImporting(true);
    const failed: ImportFileError[] = [];
    let successCount = 0;

    try {
      for (const filePath of paths) {
        const fileName = getFileName(filePath);
        try {
          const raw = await readTextFile(filePath);
          const isJson = filePath.toLowerCase().endsWith('.json');
          const res = isJson ? parseJson(raw) : parseText(raw);
          if (!res.ok) {
            failed.push({ fileName, errors: res.errors });
            continue;
          }
          const title = extractTitle(filePath);
          await createExam.mutateAsync(toExamInput({ title, questions: res.value }));
          successCount++;
        } catch (err) {
          failed.push({
            fileName,
            errors: [{ message: err instanceof Error ? err.message : String(err) }],
          });
        }
      }

      if (successCount > 0) {
        toast.success(
          paths.length === 1
            ? `Đã nhập bộ đề "${extractTitle(paths[0])}"`
            : `Đã nhập ${successCount}/${paths.length} bộ đề`,
        );
      }
      if (failed.length > 0) {
        setImportErrors(failed);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const exportExam = async (examId: Id, title: string, format: 'txt' | 'json' = 'txt') => {
    const questions = await qc.query({
      queryKey: examKeys.questions(examId),
      queryFn: () => questionService.listAll(examId),
    });
    const path = await save({
      defaultPath: `${title}.${format}`,
      filters: [
        format === 'json'
          ? { name: 'JSON', extensions: ['json'] }
          : { name: 'Text', extensions: ['txt'] },
      ],
    });
    if (!path) return;
    const content = format === 'json' ? toJson(questions) : toText(questions);
    await writeTextFile(path, content);
    toast.success(`Đã xuất file ${format.toUpperCase()}`);
  };

  return {
    importExam,
    exportExam,
    isImporting,
    importErrors,
    clearImportErrors: () => setImportErrors(null),
  };
}
