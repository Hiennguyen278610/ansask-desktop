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
  const rawName = filePath.split(/[/\\]/).pop() ?? 'Bộ đề mới';
  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

function extractTitle(filePath: string): string {
  const name = getFileName(filePath).replace(/\.(txt|json)$/i, '');
  if (!name || /^document:\d+$/i.test(name)) {
    return 'Bộ đề mới';
  }
  return name;
}

function isJsonContent(fileName: string, raw: string): boolean {
  if (fileName.toLowerCase().endsWith('.json')) return true;
  if (fileName.toLowerCase().endsWith('.txt')) return false;
  const trimmed = raw.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function pickFilesFallback(): Promise<{ name: string; raw: string }[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      const loaded = await Promise.all(
        files.map(async (f) => ({ name: f.name, raw: await f.text() })),
      );
      resolve(loaded);
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}

export function useExamIO(subjectId: Id) {
  const qc = useQueryClient();
  const createExam = useCreateExam(subjectId);
  const [importErrors, setImportErrors] = useState<ImportFileError[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const importFiles = async (entries: { name: string; read: () => Promise<string> }[]) => {
    if (entries.length === 0) return;
    setIsImporting(true);
    const failed: ImportFileError[] = [];
    let successCount = 0;
    let lastTitle = 'Bộ đề mới';

    try {
      for (const entry of entries) {
        const fileName = getFileName(entry.name);
        try {
          const raw = await entry.read();
          const isJson = isJsonContent(fileName, raw);
          const res = isJson ? parseJson(raw) : parseText(raw);
          if (!res.ok) {
            failed.push({ fileName, errors: res.errors });
            continue;
          }
          const title = res.title?.trim() || extractTitle(fileName);
          lastTitle = title;
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
          entries.length === 1
            ? `Đã nhập bộ đề "${lastTitle}"`
            : `Đã nhập ${successCount}/${entries.length} bộ đề`,
        );
      }
      if (failed.length > 0) {
        setImportErrors(failed);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const importExam = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Đề', extensions: ['txt', 'json'] }],
      });
      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      await importFiles(
        paths.map((filePath) => ({
          name: filePath,
          read: () => readTextFile(filePath),
        })),
      );
    } catch {
      // Fallback for non-Tauri mobile/browser preview
      const files = await pickFilesFallback();
      await importFiles(
        files.map((f) => ({
          name: f.name,
          read: async () => f.raw,
        })),
      );
    }
  };

  const exportExam = async (examId: Id, title: string, format: 'txt' | 'json' = 'txt') => {
    const questions = await qc.query({
      queryKey: examKeys.questions(examId),
      queryFn: () => questionService.listAll(examId),
    });
    const path = await save({
      defaultPath: `${examId}.${format}`,
      filters: [
        format === 'json'
          ? { name: 'JSON', extensions: ['json'] }
          : { name: 'Text', extensions: ['txt'] },
      ],
    });
    if (!path) return;
    const content = format === 'json' ? toJson(questions, title) : toText(questions, title);
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
