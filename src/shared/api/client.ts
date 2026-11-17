import { invoke } from '@tauri-apps/api/core';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (e) {
    const x = e as { code?: string; message?: string };
    throw new AppError(x?.code ?? 'UNKNOWN', x?.message ?? String(e));
  }
}
