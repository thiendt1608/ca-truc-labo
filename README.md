# CA TRỰC LABO

Game web miễn phí về một ca làm việc của kỹ thuật viên xét nghiệm y học, cho người chơi từ 13 tuổi. Chơi trên điện thoại, không cần tài khoản.

> Bản hiện tại là **mốc M2, hộp xám (greybox)**: luật chơi chạy được nhưng hình ảnh mới là khối và chữ. Có 2 ngày chơi được: **0.1 Tiếp nhận** và **1.1 Hoá sinh**.

## Chạy thử

Cần Node 22+ và pnpm (`corepack enable`).

```bash
pnpm install
pnpm dev            # mở http://localhost:5173 ; thêm ?debug=1 để bật bảng debug
```

| Lệnh                                           | Việc                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm test`                                    | Test lõi mô phỏng (Vitest)                                           |
| `pnpm test:e2e`                                | Test giao diện trên khung điện thoại 360×640 và 390×844 (Playwright) |
| `pnpm content:check`                           | Kiểm tra dữ liệu trong `content/`                                    |
| `pnpm balance [n]`                             | Bot chơi n ca mỗi ngày, in phân bố sao                               |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | Kiểm tra mã                                                          |
| `pnpm build`                                   | Ra web tĩnh trong `dist/`                                            |

## Cấu trúc

```
content/        dữ liệu game (JSON): ống, xét nghiệm, luật, ngày, thẻ Sổ tay, chuỗi tiếng Việt
src/sim/        lõi mô phỏng TypeScript thuần, tất định (không React, không Math.random, không Date.now)
  core/         rng, engine (lệnh → trạng thái + sự kiện), sinh mẫu, kết quả, chấm điểm, Westgard
  departments/  reception (luật tiếp nhận chung), chem (ly tâm, máy hoá sinh, trả kết quả)
  minigames/    generate() + score() thuần cho từng mini-game
  bots/         bot chơi headless cho test và cân bằng
src/store/      Zustand: giữ trạng thái ca, vòng lặp đồng hồ
src/ui/         React: màn hình, lớp phủ, khung mini-game
src/platform/   lưu tiến trình (IndexedDB)
tools/          content-check, balance-bot
tests/          Playwright
docs/           bộ tài liệu thiết kế (đọc docs/00-README.md trước)
```

Kiến trúc chi tiết: `docs/07-TDD.md`. Thêm một ngày chơi: tạo `content/days/chX-dY.json` rồi import trong `src/sim/content/bundled.ts`.

## Tuyên bố

CA TRỰC LABO là game giải trí. Kiến thức trong game được đơn giản hoá từ giáo trình và tài liệu quốc tế, không thay thế quy trình, hướng dẫn chuyên môn hay tư vấn y tế. Mọi nhân vật và bệnh nhân đều là hư cấu.
