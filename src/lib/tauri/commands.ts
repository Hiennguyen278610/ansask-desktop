/**
 * Mirror DTO type từ Rust — structure-be.md §6.3 (đồng bộ thủ công).
 * Sprint 00 chỉ khai báo command cần cho hạ tầng (setting) + subject list/create stub.
 */
import { invoke } from './invoke';

// ---------- Shared types ----------
export interface SettingValueDto {
  key: string;
  value: string;
}

export interface SubjectSummary {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  examCount: number;
  questionCount: number;
}

// ---------- Commands ----------
export function settingGet(key: string): Promise<SettingValueDto> {
  return invoke<SettingValueDto>('setting_get', { req: { key } });
}

export function settingSet(key: string, value: string): Promise<SettingValueDto> {
  return invoke<SettingValueDto>('setting_set', { req: { key, value } });
}

// Sprint 01 sẽ thêm: subject_list, subject_create, subject_update, subject_delete, exam_*.
