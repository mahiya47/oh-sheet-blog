import { useEffect } from 'react';

// Calls `handler` when a pointer or keydown(Escape) happens outside `ref`.
// Used to dismiss the nav menu and the per-card "more" menu.
export function useClickAway(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') handler();
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, handler, active]);
}
