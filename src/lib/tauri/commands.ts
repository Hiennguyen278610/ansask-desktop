import { invoke } from './invoke';

export interface SettingValueDto { key: string; value: string; }
export interface SubjectSummary { id: string; name: string; color: string; createdAt: string; examCount: number; questionCount: number; }
export interface ExamSummary { id: string; subjectId: string; title: string; createdAt: string; attemptCount: number; questionCount: number; }
export interface OptionDto { id: string; text: string; isCorrect: boolean; }
export interface QuestionDto { id: string; ask: string; options: OptionDto[]; }
export interface ExamDetail { id: string; subjectId: string; title: string; createdAt: string; updatedAt: string; questions: QuestionDto[]; }

export interface QuestionUpsertReq { ask: string; options: { text: string; isCorrect: boolean; }[]; }
export interface ExamSaveReq { id?: string; subjectId: string; title: string; questions: QuestionUpsertReq[]; }

export interface ValidationIssue { line?: number; field?: string; message: string; }
export interface ParsedExamDto { questions: QuestionUpsertReq[]; issues: ValidationIssue[]; }

export interface QuizQuestionDto { id: string; ask: string; options: OptionDto[]; optionOrder: string[]; }
export interface QuizStartRes { questions: QuizQuestionDto[]; total: number; }

export interface AttemptAnswerReq { questionId: string; selectedOptionIds: string[]; position: number; optionOrder: string[]; }
export interface AttemptSubmitReq { examId: string; startedAt: string; answers: AttemptAnswerReq[]; }
export interface AttemptResultDto { attemptId: string; score: number; correctCount: number; totalQuestions: number; }

export interface AttemptSummary { id: string; examId: string; examTitle: string; subjectId: string; subjectName: string; submittedAt: string; totalQuestions: number; correctCount: number; score: number; durationSec: number; }
export interface GradedQuestionDto { questionId: string; position: number; questionText: string; optionsSnapshot: OptionDto[]; correctOptionIds: string[]; selectedOptionIds: string[]; optionOrder: string[]; isCorrect: boolean; }
export interface AttemptReviewDto { attemptId: string; examId: string; subjectId: string; examTitle: string; score: number; totalQuestions: number; correctCount: number; questions: GradedQuestionDto[]; }

export interface TrashItemDto {
  id: string;
  kind: "subject" | "exam";
  name: string;
  subjectId?: string;
  subjectName?: string;
  deletedAt: string;
  questionCount: number;
  attemptCount: number;
  deletedByParent: boolean;
}

export function settingGet(key: string): Promise<SettingValueDto> { return invoke('setting_get', { req: { key } }); }
export function settingSet(key: string, value: string): Promise<SettingValueDto> { return invoke('setting_set', { req: { key, value } }); }

export function subjectList(): Promise<SubjectSummary[]> { return invoke('subject_list'); }
export function subjectCreate(name: string, color: string): Promise<SubjectSummary> { return invoke('subject_create', { req: { name, color } }); }
export function subjectUpdate(id: string, name: string, color: string): Promise<void> { return invoke('subject_update', { req: { id, name, color } }); }
export function subjectDelete(id: string): Promise<void> { return invoke('subject_delete', { req: { id } }); }

export function examList(subjectId: string): Promise<ExamSummary[]> { return invoke('exam_list', { req: { subjectId } }); }
export function examGet(id: string): Promise<ExamDetail> { return invoke('exam_get', { req: { id } }); }
export function examSave(req: ExamSaveReq): Promise<string> { return invoke('exam_save', { req }); }
export function examDelete(id: string): Promise<void> { return invoke('exam_delete', { req: { id } }); }

export function importParse(format: 'txt' | 'json', raw: string): Promise<ParsedExamDto> { return invoke('import_parse', { req: { format, raw } }); }

export function quizStart(examId: string, count?: number, randomize = true): Promise<QuizStartRes> { return invoke('quiz_start', { req: { examId, count, randomize } }); }
export function attemptSubmit(req: AttemptSubmitReq): Promise<AttemptResultDto> { return invoke('attempt_submit', { req }); }
export function attemptList(examId: string): Promise<AttemptSummary[]> { return invoke('attempt_list', { req: { examId } }); }
export function attemptListAll(): Promise<AttemptSummary[]> { return invoke('attempt_list_all'); }
export function attemptReview(id: string): Promise<AttemptReviewDto> { return invoke('attempt_review', { req: { id } }); }

export function trashList(): Promise<TrashItemDto[]> { return invoke('trash_list'); }
export function subjectRestore(id: string, newName?: string): Promise<void> { return invoke('subject_restore', { req: { id, newName } }); }
export function examRestore(id: string, newName?: string): Promise<void> { return invoke('exam_restore', { req: { id, newName } }); }
export function trashPurgeItem(kind: "subject" | "exam", id: string): Promise<void> { return invoke('trash_purge_item', { req: { kind, id } }); }
export function trashEmpty(): Promise<void> { return invoke('trash_empty'); }
