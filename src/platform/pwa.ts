/**
 * PWA: đăng ký service worker (chỉ ở bản build), bắt sự kiện "cài app" và "có bản mới".
 * Thuần trình duyệt, không phụ thuộc React: giao diện đọc qua `subscribePwa`/`getPwa`.
 */

export interface PwaState {
  /** Có bản mới đã tải xong, đang chờ người chơi bấm "Tải lại". */
  updateReady: boolean;
  /** Trình duyệt cho phép hiện hộp cài app (Chrome/Android...). */
  canInstall: boolean;
  /** Đang chạy như app đã cài (không còn thanh địa chỉ). */
  standalone: boolean;
  /** iPhone/iPad: không có hộp cài, chỉ hướng dẫn "Chia sẻ → Thêm vào MH chính". */
  ios: boolean;
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const nav = typeof navigator === 'undefined' ? undefined : navigator;
let state: PwaState = {
  updateReady: false,
  canInstall: false,
  standalone: false,
  ios: false,
};
let installEvent: InstallPromptEvent | null = null;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();

function patch(next: Partial<PwaState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const getPwa = (): PwaState => state;

export function subscribePwa(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Gọi một lần khi khởi động (src/main.tsx). */
export function initPwa(): void {
  if (!nav || typeof window === 'undefined') return;
  const ua = nav.userAgent;
  patch({
    standalone:
      window.matchMedia('(display-mode: standalone)').matches ||
      (nav as Navigator & { standalone?: boolean }).standalone === true,
    // iPadOS mới báo là Mac có màn hình cảm ứng.
    ios: /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1),
  });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as InstallPromptEvent;
    patch({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    patch({ canInstall: false, standalone: true });
  });
  // Service worker chỉ có ở bản build: `vite dev` không đăng ký để khỏi phá HMR và e2e.
  if (import.meta.env.PROD && 'serviceWorker' in nav) {
    void import('virtual:pwa-register').then(({ registerSW }) => {
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh: () => patch({ updateReady: true }),
      });
    });
  }
}

/** Hiện hộp cài app của trình duyệt (chỉ khi `canInstall`). */
export async function promptInstall(): Promise<void> {
  const ev = installEvent;
  if (!ev) return;
  installEvent = null;
  patch({ canInstall: false });
  await ev.prompt();
  await ev.userChoice;
}

/** Kích hoạt bản mới và tải lại trang. Chỉ gọi từ nút do người chơi bấm ở Sảnh/Cài đặt. */
export function applyUpdate(): void {
  void updateSW?.(true);
}
