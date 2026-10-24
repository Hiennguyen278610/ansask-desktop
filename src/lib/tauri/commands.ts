import { invoke } from './invoke';

export interface SettingValueDto { key: string; value: string; }
export interface SubjectSummary {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  examCount: number;
  questionCount: number;
}
export interface ExamSummary {
  id: string;
  subjectId: string;
  title: string;
  createdAt: string;
  attemptCount: number;
  questionCount: number;
}
export interface OptionDto { id: string; text: string; isCorrect: boolean; }
export interface QuestionDto { id: string; ask: string; options: OptionDto[]; }
export interface ExamDetail {
  id: string;
  subjectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  questions: QuestionDto[];
}
export interface ExamSaveReq {
  id?: string;
  subjectId: string;
  title: string;
  questions: { ask: string; options: { text: string; isCorrect: boolean }[] }[];
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
