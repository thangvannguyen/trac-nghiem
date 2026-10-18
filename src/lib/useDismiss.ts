import { useEffect, useRef } from 'react';

/**
 * Đóng menu / popover khi bấm ra ngoài hoặc nhấn Esc.
 * (Không dùng lớp phủ "fixed inset-0" vì thanh menu có backdrop-blur khiến lớp phủ chỉ nằm trong thanh menu.)
 */
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}
