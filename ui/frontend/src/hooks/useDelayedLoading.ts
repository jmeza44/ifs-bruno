import { useEffect, useRef, useState } from 'react';

export type UseDelayedLoadingOptions = {
  /** Wait this long before showing the loader, so fast loads never flash it. */
  delayMs?: number;
  /** Once shown, keep the loader visible at least this long, so it doesn't flash off. */
  minDurationMs?: number;
};

const DEFAULT_DELAY_MS = 300;
const DEFAULT_MIN_DURATION_MS = 400;

/**
 * Debounces a raw `isLoading` flag so the UI only shows a loading state when the
 * underlying operation is actually slow, and — once shown — keeps it visible long
 * enough to read instead of flashing on and off.
 */
export function useDelayedLoading(
  isLoading: boolean,
  { delayMs = DEFAULT_DELAY_MS, minDurationMs = DEFAULT_MIN_DURATION_MS }: UseDelayedLoadingOptions = {},
): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      const showTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShowLoading(true);
      }, delayMs);
      return () => clearTimeout(showTimer);
    }

    if (!showLoading) return;

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : minDurationMs;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const hideTimer = setTimeout(() => {
      shownAtRef.current = null;
      setShowLoading(false);
    }, remaining);
    return () => clearTimeout(hideTimer);
  }, [isLoading, delayMs, minDurationMs, showLoading]);

  return showLoading;
}
