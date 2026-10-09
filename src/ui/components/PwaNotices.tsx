import { useSyncExternalStore } from 'react';
import { applyUpdate, getPwa, promptInstall, subscribePwa } from '../../platform/pwa';

export function usePwa() {
  return useSyncExternalStore(subscribePwa, getPwa);
}

/** Dòng "Có bản mới — Tải lại". Chỉ gắn ở Sảnh/Cài đặt (ngoài ca), không bao giờ tự tải lại giữa ca. */
export function UpdateNotice() {
  const { updateReady } = usePwa();
  if (!updateReady) return null;
  return (
    <div className="card row update-notice" role="status">
      <span className="grow">Có bản mới của game.</span>
      <button className="primary" onClick={applyUpdate}>
        Tải lại
      </button>
    </div>
  );
}

/** Cách thêm game vào màn hình chính: nút cài (Chrome/Android) hoặc hướng dẫn (iPhone/iPad, trình duyệt khác). */
export function InstallInfo() {
  const { canInstall, standalone, ios } = usePwa();
  if (standalone) return <p className="muted">Game đã được cài trên máy này.</p>;
  if (canInstall) {
    return (
      <button onClick={() => void promptInstall()}>
        <span aria-hidden>📲</span> Cài app lên máy
      </button>
    );
  }
  if (ios) {
    return (
      <p className="muted">
        Trên Safari: bấm nút <b>Chia sẻ</b> rồi chọn <b>Thêm vào MH chính</b>.
      </p>
    );
  }
  return (
    <p className="muted">
      Mở menu của trình duyệt rồi chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.
    </p>
  );
}
