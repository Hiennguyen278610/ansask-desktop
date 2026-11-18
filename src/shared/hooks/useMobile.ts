import { useEffect, useState } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';
const TABLET_MEDIA_QUERY = '(min-width: 640px)';
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export function isMobilePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function subscribeMedia(query: string, onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia(query);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function matchesMedia(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

/**
 * Returns true on mobile platforms (Android/iOS) or mobile-width viewports (< 768px).
 */
export function useIsMobile(): boolean {
  const [smallViewport, setSmallViewport] = useState(() => matchesMedia(MOBILE_MEDIA_QUERY));

  useEffect(() => {
    const update = () => setSmallViewport(matchesMedia(MOBILE_MEDIA_QUERY));
    update();
    return subscribeMedia(MOBILE_MEDIA_QUERY, update);
  }, []);

  return smallViewport || isMobilePlatform();
}

/**
 * Returns responsive grid column count: 1 on mobile, 2 on small tablet, 3 on desktop.
 */
export function useGridColumns(): number {
  const getCols = () => {
    if (matchesMedia(DESKTOP_MEDIA_QUERY)) return 3;
    if (matchesMedia(TABLET_MEDIA_QUERY)) return 2;
    return 1;
  };

  const [cols, setCols] = useState(getCols);

  useEffect(() => {
    const update = () => setCols(getCols());
    update();
    const unsubTablet = subscribeMedia(TABLET_MEDIA_QUERY, update);
    const unsubDesktop = subscribeMedia(DESKTOP_MEDIA_QUERY, update);
    return () => {
      unsubTablet();
      unsubDesktop();
    };
  }, []);

  return cols;
}
