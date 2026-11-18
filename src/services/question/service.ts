import type { Id, Question } from '@/domain/types';
import { call } from '@/shared/api/client';

export const questionService = {
  listAll: (examId: Id) => call<Question[]>('question_list_all', { req: { examId } }),
};
