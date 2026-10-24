import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectList, subjectCreate, subjectDelete } from '@/lib/tauri/commands';

export function useSubjects() {
  return useQuery({ queryKey: ['subjects'], queryFn: subjectList });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => subjectCreate(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}
