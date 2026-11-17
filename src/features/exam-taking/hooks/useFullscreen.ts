import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useFullscreen() {
  useEffect(() => {
    let active = true;
    const setFs = async (flag: boolean) => {
      try {
        await getCurrentWindow().setFullscreen(flag);
      } catch {
        // Ignore when running outside Tauri webview (e.g., browser dev preview)
      }
    };
    if (active) void setFs(true);
    return () => {
      active = false;
      void setFs(false);
    };
  }, []);
}
