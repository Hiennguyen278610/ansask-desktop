import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examList, examDelete } from '@/lib/tauri/commands';

export function useExams(subjectId: string) {
  return useQuery({
    queryKey: ['exams', subjectId],
    queryFn: () => examList(subjectId),
    enabled: !!subjectId,
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] });
      qc.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}
