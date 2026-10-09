import { useEffect, type RefObject } from 'react';

/** Người chơi đã tắt chuyển động (công tắc Cài đặt hoặc hệ điều hành): cuộn nhảy luôn, không mượt. */
function prefersReducedMotion(): boolean {
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  );
}

/**
 * Cuộn tấm (`.sheet`) tới đoạn từ `top` đến `bottom`: nếu cả đoạn lọt vừa tầm nhìn thì đặt `top` gần mép trên,
 * nếu không thì đặt `bottom` sát mép dưới (ưu tiên nút hành động ở cuối đoạn).
 */
export function scrollSheetToFit(top: HTMLElement, bottom: HTMLElement) {
  const sheet = top.closest<HTMLElement>('.sheet');
  if (!sheet) return;
  const box = sheet.getBoundingClientRect();
  const t = top.getBoundingClientRect();
  const b = bottom.getBoundingClientRect();
  const style = getComputedStyle(sheet);
  const padTop = parseFloat(style.paddingTop) || 0;
  // Dải đệm đáy của tấm là `::after` dính (xem `.sheet::after`), nên đó mới là phần đáy bị che.
  const padBottom = parseFloat(getComputedStyle(sheet, '::after').height) || 0;
  const view = sheet.clientHeight - padBottom;
  const fits = b.bottom - t.top <= view - padTop;
  const delta = fits ? t.top - box.top - padTop : b.bottom - box.top - view;
  sheet.scrollTo({
    top: Math.max(0, sheet.scrollTop + delta),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/**
 * Mỗi khi `trigger` đổi sang một giá trị khác null (nội dung đổi, nút hành động chính có thể tụt xuống dưới nếp gập)
 * thì cuộn tấm tới đoạn `top`…`bottom`.
 */
export function useScrollSheetToFit(
  top: RefObject<HTMLElement | null>,
  bottom: RefObject<HTMLElement | null>,
  trigger: string | null,
) {
  useEffect(() => {
    if (trigger !== null && top.current && bottom.current) scrollSheetToFit(top.current, bottom.current);
  }, [top, bottom, trigger]);
}

/** Phản hồi mới xuất hiện ở cuối màn (dưới nếp gập): cuộn vừa đủ để thấy nó, không giật bố cục phía trên. */
export function useRevealOnShow(ref: RefObject<HTMLElement | null>, shown: boolean) {
  useEffect(() => {
    if (shown)
      ref.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [ref, shown]);
}
