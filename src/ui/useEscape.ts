import { useEffect, useRef } from 'react';

interface Entry {
  onEscape: () => void;
  enabled: boolean;
}

/** Ngăn xếp lớp phủ đang mở; phần tử cuối là lớp trên cùng. */
const stack: { current: Entry }[] = [];

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const top = stack[stack.length - 1];
  if (!top) return;
  // Lớp trên cùng không cho đóng (quyết định bắt buộc, đang trong mini-game) thì chặn luôn lớp dưới.
  if (top.current.enabled) {
    e.preventDefault();
    top.current.onEscape();
  }
}

/**
 * Phím Escape đóng lớp phủ. Chỉ đăng ký khi lớp phủ gắn vào cây (mở) và dọn khi đóng; lớp mở sau
 * (nằm trên) đóng trước. `enabled=false` giữ vị trí trong ngăn xếp nhưng không đóng và không cho lớp dưới đóng.
 */
export function useEscape(onEscape: () => void, enabled = true) {
  const entry = useRef<Entry>({ onEscape, enabled });
  useEffect(() => {
    entry.current = { onEscape, enabled };
  });
  useEffect(() => {
    const ref = entry;
    if (stack.length === 0) window.addEventListener('keydown', onKeyDown);
    stack.push(ref);
    return () => {
      stack.splice(stack.indexOf(ref), 1);
      if (stack.length === 0) window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
