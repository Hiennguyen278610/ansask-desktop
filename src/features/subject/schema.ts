import { z } from 'zod';

export const renameSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên môn học không được để trống.')
    .max(100, 'Tên môn học tối đa 100 ký tự.'),
});

export const createSubjectSchema = renameSubjectSchema.extend({
  icon: z.string().min(1, 'Vui lòng chọn icon nhận diện.'),
});

export type CreateSubjectForm = z.infer<typeof createSubjectSchema>;
export type RenameSubjectForm = z.infer<typeof renameSubjectSchema>;
