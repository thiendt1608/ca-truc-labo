# Ghi chú cho người (và AI) sửa mã

- Đọc `docs/00-README.md` trước; luật chơi ở `docs/04-GDD.md`, `docs/04a-GDD-cac-khoa.md`, kiến thức chuyên môn ở `docs/05-noi-dung-chuyen-mon.md`, kiến trúc ở `docs/07-TDD.md`.
- `src/sim/` phải tất định: không `Math.random`, không `Date.now`, không import từ `ui/`, `store/`, `platform/` (ESLint chặn). Mọi ngẫu nhiên qua `Rng` trong `ShiftState.rngState`.
- Luật chuyên môn đặt trong `content/*.json`, không rải `if` trong code. Mỗi luật có `explanationKey` (chuỗi trong `content/i18n/vi.json`) và thẻ Sổ tay.
- Mini-game: `generate(seed, difficulty)` và `score(input, actions)` là hàm thuần trong `src/sim/minigames`; component React chỉ ghi thao tác.
- Mọi chữ hiển thị bằng tiếng Việt; trò chơi không bao giờ chẩn đoán bệnh.
- Trước khi đẩy: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm content:check && pnpm test`.
