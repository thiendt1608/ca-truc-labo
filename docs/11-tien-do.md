# 11. Tiến độ và việc tiếp theo

> Cập nhật: 2026-11-05. Agent ở session mới: đọc file này đầu phiên, rồi `AGENTS.md` (phạm vi đã/chưa làm, kiến trúc,
> lệnh) và `CHANGELOG.md`. Xong một phase/PR thì thêm một dòng vào mục 2 và sửa mục 3–4.

## 1. Đang ở đâu

- **Mốc**: M3 (vertical slice chương 0–1). Đã xong M3-1 QC, M3-2 pha loãng/nước tiểu/Δ, M3-3 sự kiện + điện thoại,
  M3-6 Sổ tay + 3 mức khó, M3-7 lưu game + Cài đặt + PWA. M3-5 (hình, tiếng thật) **hoãn** tới khi game ổn định. Còn
  lại: **M3-8** kiểm tra trên điện thoại thật + chơi thử 8–10 người.
- **Chơi được**: 8 ca `ch0-d1`–`ch0-d3` (Tiếp nhận) và `ch1-d1`–`ch1-d5` (Hoá sinh).
- **Bản chạy thật**: https://thiendt1608.github.io/ca-truc-labo/ (GitHub Pages, tự deploy khi merge vào `main`).
- **`main`** đang ở `5509e75` (merge PR #4). Không có PR nào đang mở.

## 2. Nhật ký PR

| PR | Ngày merge | Nội dung |
| --- | --- | --- |
| [#1](https://github.com/thiendt1608/ca-truc-labo/pull/1) | 2026-10-08 | M2 hộp xám: lõi mô phỏng tất định, Tiếp nhận, Hoá sinh. |
| [#2](https://github.com/thiendt1608/ca-truc-labo/pull/2) | 2026-10-31 | Playtest lần 1 (8 ý của người chơi mới, xem `10-playtest-redesign.md` mục 1–3): mặc định mức Dễ, thanh kiên nhẫn thay số phút, FX ✓/✗ + ống bay vào giỏ, Niềm tin bay số, bớt chữ, từ chối = chạm vào chỗ sai, `carry` đồng hồ ra biến module. |
| [#3](https://github.com/thiendt1608/ca-truc-labo/pull/3) | 2026-10-31 | Sửa "đồng hồ đứng, hiệu ứng đơ" trên GitHub Pages: mẹo hướng dẫn giữ đồng hồ tới khi bấm. Nay mẹo tự đóng sau `tipReadMs(text)` (4–9 s, có thanh đếm) và đóng khi mở tấm bất kỳ; mẹo ≤ 100 ký tự. |
| [#4](https://github.com/thiendt1608/ca-truc-labo/pull/4) | 2026-10-31 | Playtest lần 2 (tự chơi ở 390×844): chia khoa một chạm ở tiếp nhận, nút "⏩ Tua tới mẫu kế" (×4, dừng ở `RUSH_STOPS`), tấm tự đóng khi hết việc (`useCloseWhenEmptied`), máy ly tâm giữ chỗ ống đã đặt, que nước tiểu nhúng ngay, FX 📨 khi gửi kết quả, lọ mô thiếu dịch rõ hơn. |

## 3. Việc tiếp theo (chưa làm, chủ dự án chọn thứ tự)

1. **M3-8**: chơi trên điện thoại thật + 8–10 người chơi thử; ghi góp ý vào một mục mới của `10-playtest-redesign.md`.
2. **Giai đoạn 2 của playtest** (`10-playtest-redesign.md` mục 4), cộng các điểm thấy ở lần tự chơi thứ 2:
   - QC vẫn giống câu đố (chọn Đạt/Cảnh báo/Không đạt): đổi thành chạm điểm lệch trên biểu đồ, khắc phục có hình.
   - Mini-game que nước tiểu còn dài.
   - "Nạp tất cả" ở máy hoá sinh cho phép bỏ qua bước xem huyết thanh.
   - Phòng vẽ thành cảnh, kéo ống vào giỏ; mũi tên hướng dẫn đúng lúc; âm thanh (gắn với M3-5).
3. **Bảo mật dependency**: `pnpm audit` báo 1 lỗi high ở `zod` (GHSA-mrhx-c7xc-m3w5), cần nâng lên ≥ 4.6.6 và chạy lại
   toàn bộ test (schema nội dung dùng Zod).
4. Sau M3: M4 Huyết học – Truyền máu (`08-ke-hoach-du-an.md`).

## 4. Chưa kiểm được

- CI chỉ chạy Ubuntu. **Not verified: Windows, macOS** (game là web tĩnh nên rủi ro thấp, nhưng chưa có bằng chứng).
- Chưa thử trên điện thoại thật (M3-8). Các lần tự chơi dùng giả lập 390×844 và 360×640 trong trình duyệt.

## 5. Cách làm việc đã chốt với chủ dự án

- **Không build/test nặng trên máy** (`pnpm build`, Playwright). Push nhánh để CI chạy, theo dõi bằng
  `gh run watch <id> --exit-status` chạy nền. Trên máy chỉ chạy cổng nhẹ:
  `pnpm lint && pnpm format:check && pnpm typecheck && pnpm content:check && pnpm test` (với `nice -n 19`).
- **CI** `.github/workflows/ci.yml`: job `check` (mọi lần push/PR), `e2e` (chỉ PR, Playwright 360/390 trên bản build),
  `deploy` (push vào `main` hoặc chạy tay, lên GitHub Pages).
- **Trước mỗi commit**: chạy skill `sec`, `rules`, `aup-audit` trên diff và `8sync ccc risk`; message commit qua
  stylesync; conventional commits; thay đổi người chơi thấy được thì cập nhật `CHANGELOG.md`; thay đổi lớn thì cập nhật
  `AGENTS.md`. Không commit `.claude/`.
- **Merge/deploy**: mỗi PR cần một lần duyệt "Ship" riêng của chủ dự án (merge vào `main` = deploy lên Pages).
- Lối chơi: GDD (`04-GDD.md`) là nguồn chuẩn cho cơ chế; mockup `stitch-design/` có tính năng ngoài GDD (xu, EXP,
  cửa hàng), không làm theo phần đó.
