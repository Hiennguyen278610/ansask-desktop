import { invoke as tauriInvoke } from '@tauri-apps/api/core';

export interface AppErrorPayload {
  code: string;
  message: string;
}

export class AppException extends Error {
  code: string;
  constructor(payload: AppErrorPayload) {
    super(payload.message);
    this.code = payload.code;
  }
}

function isAppError(v: unknown): v is AppErrorPayload {
  return typeof v === 'object' && v !== null && 'code' in v && 'message' in v;
}

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await tauriInvoke<T>(cmd, args);
  } catch (err) {
    if (isAppError(err)) throw new AppException(err);
    throw new AppException({ code: 'UNKNOWN', message: String(err) });
  }
}
