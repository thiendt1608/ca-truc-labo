# CA TRỰC LABO — Technical Design Document (TDD)

> Phiên bản: 2.0 · Ngày: 2026-10-07 · v2.0: 5 khoa dạng module, khung mini-game dùng chung, kính hiển vi, việc tồn qua ngày, tải theo chương
> **TDD là gì?** GDD nói game *làm gì*; TDD nói game *được xây thế nào*: công nghệ, kiến trúc, dữ liệu, lưu trữ, kiểm thử. Với Thien (backend/AI dev), phần lớn tài liệu này sẽ quen thuộc; chỗ khác biệt so với làm backend được ghi chú "💡 Khác backend".

## 1. Mục tiêu và ràng buộc kỹ thuật

| Mục tiêu | Chỉ số |
|---|---|
| Mở là chơi | Lần tải đầu < 2 MB (đã nén) cho chương 0–1; mỗi khoa tải thêm khi mở (chia gói theo khoa, < 1 MB mỗi khoa); chơi được trong < 3 giây trên 4G |
| Mượt trên điện thoại tầm trung | 60 khung hình/giây trên Android tầm trung đời 3 năm trước; không giật khi có 60 mẫu trên bàn |
| Chạy offline sau lần tải đầu | Toàn bộ game cache được (PWA) |
| Trình duyệt hỗ trợ | Safari iOS 16+, Chrome Android 10+, Chrome/Edge/Firefox/Safari desktop 2 năm gần nhất |
| Không máy chủ, miễn phí | Web tĩnh; không tài khoản; không quảng cáo; không thu dữ liệu cá nhân |
| Tái lập được | Cùng hạt giống + cùng chuỗi thao tác → cùng kết quả (cho Ca thử thách, kiểm thử, báo lỗi) |

## 2. Lựa chọn công nghệ

### 2.1. Kết luận

| Phần | Chọn | Lý do ngắn |
|---|---|---|
| Ngôn ngữ | TypeScript (strict) | Kiểu dữ liệu chặt cho mô hình phức tạp |
| Build | Vite | Nhanh, đơn giản, ra web tĩnh |
| Giao diện | React + CSS Modules (hoặc Tailwind) | Game nhiều chữ, thẻ, danh sách, biểu đồ: giống app hơn giống game hành động |
| Trạng thái UI | Zustand | Nhẹ, dễ nối với lõi mô phỏng |
| Lõi mô phỏng | TypeScript thuần, không phụ thuộc React | Kiểm thử độc lập, chạy headless được |
| Hoạt ảnh | CSS transitions + Motion (Framer Motion) | Đủ cho di chuyển ống, rung máy |
| Biểu đồ QC | SVG tự vẽ | Biểu đồ đơn giản, cần kiểm soát hoàn toàn |
| Kính hiển vi, đĩa thạch, mini-game cử chỉ | SVG (ít vật thể) hoặc Canvas 2D (nhiều vật thể, ví dụ vi trường có hàng trăm hồng cầu) + Pointer Events | Không cần engine; hình sinh theo hạt giống |
| Âm thanh | Howler.js | Xử lý khác biệt âm thanh trên iOS |
| Kiểm tra dữ liệu | Zod | Kiểm tra file nội dung lúc build |
| Lưu trữ | IndexedDB (qua idb-keyval) | Bền hơn LocalStorage, dung lượng lớn hơn |
| PWA | vite-plugin-pwa (Workbox) | Cache offline, cài lên màn hình chính |
| Kiểm thử | Vitest (logic), Playwright (giao diện, khung điện thoại) | |
| Hosting | Cloudflare Pages (hoặc Vercel/Netlify) | Miễn phí cho web tĩnh, có bản xem trước cho mỗi PR |
| Quản lý gói | pnpm | |

Phiên bản cụ thể: dùng bản ổn định mới nhất tại thời điểm khởi tạo repo, ghi vào `package.json`.

### 2.2. Vì sao không dùng các lựa chọn khác

| Lựa chọn | Đánh giá |
|---|---|
| **Next.js** (concept gốc) | Mạnh cho web có máy chủ, SEO, nhiều trang. Game này là một trang chạy hoàn toàn ở trình duyệt; Next.js chỉ thêm độ phức tạp. Có thể dùng chế độ xuất tĩnh, nhưng không có lợi ích gì so với Vite. |
| **Phaser** (game engine 2D web, bản 4) | Rất tốt cho game nhiều sprite chuyển động, vật lý, hiệu ứng hạt; hiệu năng tốt trên Safari. Nhưng game này chủ yếu là chữ, thẻ, danh sách, biểu đồ — làm bằng Phaser phải tự vẽ lại mọi nút, ô chữ, cuộn danh sách, và xử lý tiếng Việt có dấu trên canvas vất vả hơn. **Giữ làm phương án dự phòng:** nếu mini-game kính hiển vi hoặc cắt microtome cần nhiều hiệu ứng hơn Canvas 2D làm được mượt, nhúng PixiJS cho riêng component mini-game đó, không đổi lõi mô phỏng. |
| **Unity / Godot xuất web** | Bản tải lớn (nhiều MB), khởi động chậm trên điện thoại, đi ngược mục tiêu "bấm link là chơi". |
| **Kaplay, Excalibur** | Nhẹ, dễ học, nhưng cùng nhược điểm như Phaser với giao diện nhiều chữ. |

💡 Khác backend: game cần "vòng lặp khung hình" (vẽ lại 60 lần/giây). Ở đây lõi mô phỏng chạy theo tick logic; React chỉ vẽ lại khi trạng thái đổi, hoạt ảnh do CSS lo. Cách này đơn giản hơn nhiều so với tự viết render loop.

## 3. Kiến trúc tổng thể

```
┌────────────────────────────────────────────────────────────┐
│ content/  (JSON: ống, xét nghiệm, luật, ngày, sự kiện, thẻ)│
│      │  kiểm tra bằng Zod lúc build                         │
│      ▼                                                      │
│ sim/  LÕI MÔ PHỎNG (TypeScript thuần, tất định)             │
│   state  +  command(lệnh từ người chơi)  →  state' + events │
│   tick(Δ) → state' + events                                 │
│      │                         ▲                            │
│      ▼ events                  │ commands                   │
│ store/  Zustand: giữ state, chạy đồng hồ, phát events       │
│      │                         ▲                            │
│      ▼                         │                            │
│ ui/  React: màn hình, lớp phủ, hoạt ảnh, âm thanh           │
│                                                             │
│ platform/  lưu trữ, PWA, chia sẻ, âm thanh, analytics       │
└────────────────────────────────────────────────────────────┘
```

**Quy tắc:** `sim/` không được import gì từ `ui/`, `store/`, `platform/`, cũng không gọi `Date.now()` hay `Math.random()`. Mọi ngẫu nhiên đi qua bộ sinh số có hạt giống (seeded PRNG). Nhờ đó lõi chạy được trong Node để kiểm thử và chạy bot cân bằng.

💡 Khác backend: mô hình này giống **event sourcing / reducer**: `(state, command) → (newState, events)`. Một ca chơi = hạt giống + danh sách lệnh có dấu thời gian. Lưu danh sách này là có thể "phát lại" nguyên ca, rất hữu ích để tái hiện lỗi người chơi báo.

## 4. Lõi mô phỏng

### 4.1. Thời gian
- Đơn vị thời gian logic: **giây trong game**. Ca 07:00–15:00 = 28.800 giây game.
- Tỉ lệ mặc định: 1 giây thực ≈ 80 giây game (ca 8 tiếng ≈ 6 phút thực), đặt trong cấu hình. Tốc độ ×2 và độ khó (Dễ 0,6×, Khó 1,2×) chỉ đổi tỉ lệ này.
- `store` gọi `tick(Δ)` theo `requestAnimationFrame`, gộp Δ theo bước cố định 1 giây game để tất định (fixed timestep). Khi tab bị ẩn → tự tạm dừng.

### 4.2. Lệnh (commands) từ người chơi

```ts
// Lệnh chung (mọi khoa). Lệnh riêng của khoa có tiền tố, ví dụ 'micro/streakPlate', 'bb/issueUnit'.
type Command =
  | { t: number; type: 'inspectSample'; sampleId: string }
  | { t: number; type: 'contactWard'; sampleId: string }          // mẫu không lấy lại được
  | { t: number; type: 'switchRoom'; room: RoomId }
  | { t: number; type: 'minigameResult'; taskId: string; result: MinigameResult } // kết quả mini-game gửi về lõi
  | { t: number; type: 'safetyStep'; step: 'openBSC' | 'fumeHoodOn' | 'gloves' }
  | { t: number; type: 'acceptSample'; sampleId: string; target: StationId }
  | { t: number; type: 'rejectSample'; sampleId: string; reason: RejectReason }
  | { t: number; type: 'addWaterTube'; centrifugeId: string }
  | { t: number; type: 'startCentrifuge'; centrifugeId: string }
  | { t: number; type: 'prioritize'; sampleId: string }
  | { t: number; type: 'runQC'; analyzerId: AnalyzerId }
  | { t: number; type: 'judgeQC'; analyzerId: AnalyzerId; verdict: 'pass' | 'rerun' | 'fail' }
  | { t: number; type: 'qcAction'; analyzerId: AnalyzerId; action: QCAction }
  | { t: number; type: 'releaseOrder'; orderId: string }
  | { t: number; type: 'rerunOrder'; orderId: string }
  | { t: number; type: 'cancelOrderRecollect'; orderId: string }
  | { t: number; type: 'callCritical'; orderId: string; ward: WardId }
  | { t: number; type: 'answerPhone'; callId: string; choice: string }
  | { t: number; type: 'resolveEvent'; eventId: string; choice: string };
```

### 4.3. Sự kiện phát ra (events) cho giao diện
`sampleArrived`, `sampleMoved`, `centrifugeDone`, `resultReady`, `qcResult`, `phoneRing`, `randomEvent`, `trustChanged`, `mistakeRecorded`, `codexUnlocked`, `shiftEnded`. Giao diện dùng chúng để chạy hoạt ảnh, âm thanh, thông báo.

### 4.4. Trạng thái một ca (rút gọn)

```ts
interface ShiftState {
  seed: string;
  dayConfigId: string;
  clock: number;                  // giây game kể từ đầu ca
  trust: number;                  // 0..100
  patients: Record<string, Patient>;
  orders: Record<string, Order>;  // phiếu chỉ định
  samples: Record<string, Sample>;
  activeRoom: RoomId;
  rooms: Partial<Record<RoomId, DepartmentState>>; // mỗi khoa tự định nghĩa state riêng (trạm, khay, tủ ấm, kho máu...)
  qc: Record<QCTargetId, QCState>;                // máy, bộ huyết thanh mẫu, lô test, dàn nhuộm...
  phone: PhoneState;
  activeEvents: ActiveEvent[];
  ledger: MistakeEntry[];         // dùng cho "Chuyện hôm nay" và chấm điểm
  scheduled: ScheduledItem[];     // mẫu/sự kiện sắp tới (hàng đợi ưu tiên theo thời gian)
}

interface Sample {
  id: string; orderId: string;
  container: ContainerType;       // ống (5 màu), lọ nước tiểu, lọ phân, que tăm bông, chai cấy máu, lọ mô, lam...
  label: { name: string; birthYear: number; patientCode: string; ward: WardId; collectedAt: number; site?: string } | null;
  irreplaceable: boolean;         // mô, dịch não tuỷ... → không được từ chối
  defects: Defect[];              // ví dụ { kind: 'hemolysis', level: 2 }, { kind: 'underfill' }, { kind: 'noFormalin' }
  hidden: { wrongPatientId?: string; organism?: OrganismId; parasite?: ParasiteId; truth?: Record<string, number> }; // không gửi ra UI
  status: SampleStatus;           // vòng đời chung + trạng thái riêng của khoa
  arrivedAt: number;
}
```

### 4.5. Chấm đúng/sai (chung)
- Hàm thuần `evaluateDecision(sample, order, decision, sop): Verdict` đọc bảng luật trong `content/rules.json` (từ `05-noi-dung-chuyen-mon.md` mục 4). Không viết luật chuyên môn bằng `if` rải rác trong code.
- Mỗi `Verdict` có `correct`, `expected`, `explanationKey`, `codexCardId`.

### 4.6. Sinh kết quả
Theo công thức ở `05-noi-dung-chuyen-mon.md` mục 6: hồ sơ bệnh nhân → giá trị thật → nhân lệch QC → cộng nhiễu mẫu → cộng sai số ngẫu nhiên → gắn cờ (H/L, !!, Δ, HIL).

### 4.7. Sinh ca
- **Chiến dịch:** mỗi ngày là một file cấu hình (`content/days/day-06.json`): giờ ca, số mẫu theo đợt, tỉ lệ lỗi, lịch sự kiện cố định, kịch bản QC, cơ chế được mở.
- **Ca tự do:** cùng cấu trúc, tham số nội suy theo độ khó.
- **Ca thử thách:** hạt giống = `"daily-" + ngày theo giờ Việt Nam (UTC+7)`, khoa theo thứ trong tuần, mức Thường. Mọi người cùng ngày nhận cùng ca (vì lõi tất định).
- **Việc tồn qua ngày** (đĩa thạch đang ủ, kháng sinh đồ chờ đọc, khối mô đã xử lý qua đêm, chai cấy máu): **khai báo trong file cấu hình ngày** (`carryover`), sinh từ hạt giống của ngày. Không lấy từ ca trước của người chơi → chơi lại một ngày luôn giống nhau, không cần lưu trạng thái giữa các ca.

### 4.8. Module khoa và khung mini-game

Mỗi khoa là một **module** cắm vào lõi chung, cùng một giao diện:

```ts
interface DepartmentModule {
  id: RoomId;                                  // 'reception' | 'chem' | 'heme' | 'micro' | 'immuno' | 'patho'
  initState(day: DayConfig, rng: Rng): DepartmentState;
  handle(state: ShiftState, cmd: Command, rng: Rng): StepResult;   // lệnh có tiền tố của khoa
  tick(state: ShiftState, dt: number, rng: Rng): StepResult;       // máy chạy, tủ ấm, hẹn giờ test nhanh...
  rules: RuleTable;                            // đọc từ content/<khoa>/rules.json
}

interface MinigameSpec<I, R> {
  id: MinigameId;                              // 'gramStain', 'microtome', 'aboGrouping'...
  kind: 'sequence' | 'microscope' | 'timing' | 'compare' | 'measure';  // 5 khung trong 04a mục 7
  generate(seed: string, difficulty: Difficulty): I;   // đề bài tất định
  score(input: I, actions: PlayerAction[]): R & { skill: number }; // hàm thuần, test được
}
```

- **Lõi tính điểm mini-game là hàm thuần** (`generate`, `score`) nằm trong `sim/`; component React chỉ ghi lại thao tác (`PlayerAction[]`) rồi gửi `minigameResult`. Nhờ vậy bot cân bằng và test chạy được mini-game mà không cần giao diện.
- 5 component khung (`SequenceGame`, `MicroscopeGame`, `TimingGame`, `CompareGame`, `MeasureGame`) được tái dùng; mỗi mini-game cụ thể chỉ là dữ liệu + hình.
- **Kính hiển vi:** vi trường sinh từ hạt giống (vị trí tế bào/vi khuẩn/trứng), vẽ bằng Canvas 2D; hình mẫu là sprite SVG rasterize sẵn.
- **Tự động hoá:** thiết bị tự động thay mini-game bằng một "máy" có thời gian chạy và kết quả chuẩn (điểm Tay nghề không tính).

## 5. Dữ liệu nội dung (content pipeline)

```
content/
  common/
    containers.json     # ống, lọ, chai, que, lam
    reception-rules.json
    profiles.json       # hồ sơ bệnh nhân để sinh số (không chứa tên bệnh hiển thị)
    events.json  equipment.json  names.json
  chem/      tests.json  rules.json  panels.json  qc-scenarios.json  urine-strip.json
  heme/      cbc.json  wbc-types.json  coag.json  abo.json  compatibility.json  blood-units.json
  micro/     media.json  organisms.json  gram.json  ast-breakpoints.json  parasites.json
  immuno/    rapid-tests.json  elisa-kits.json  analyzer-tests.json
  patho/     specimens.json  processing.json  he-steps.json  cytology.json
  days/      ch0-d1.json ... ch6-d5.json        # 35 ngày, có trường carryover
  codex/     <khoa>.json                        # ~80 thẻ
  i18n/vi.json
```

- Mỗi luật/thẻ chuyên môn có trường `source: string[]` (trỏ tới nguồn ở `05-noi-dung-chuyen-mon.md` mục 10).
- Script `pnpm content:check`: kiểm tra Zod schema và tham chiếu chéo (ví dụ xét nghiệm trỏ tới loại ống có tồn tại, mọi chuỗi chữ có trong `i18n/vi.json`). Không có khâu duyệt bắt buộc.

## 6. Kiểm thử và cân bằng

| Loại | Công cụ | Kiểm tra gì |
|---|---|---|
| Unit | Vitest | Luật Westgard, `evaluateDecision` từng khoa, bảng ABO/hoà hợp, S/I/R, S/CO, `score()` của từng mini-game, sinh kết quả, chấm điểm |
| Kịch bản | Vitest | Phát lại chuỗi lệnh mẫu → kiểm tra điểm cuối ca đúng như mong đợi |
| Tất định | Vitest | Cùng hạt giống + lệnh → cùng trạng thái cuối (so hash) |
| Giao diện | Playwright, khung 360×640 và 390×844 | Luồng chơi ngày 1 từ đầu tới báo cáo |
| **Bot cân bằng** | Script Node chạy lõi headless | Chạy hàng nghìn ca với các "bot" (ngẫu nhiên, "người mới" chậm và hay sót lỗi khó thấy, "thành thạo" biết hết luật) → đo phân bố sao theo ngày. Mục tiêu: bot thành thạo ≥4 sao ở ngày cuối mỗi chương; bot người mới ≥3 sao ở ngày đầu mỗi chương; bot ngẫu nhiên ≤1 sao |

💡 Thế mạnh của Thien: phần bot cân bằng và phân tích số liệu playtest chính là việc của dân AI/data. Có thể thử bot dùng LLM đóng vai người chơi mới để tìm chỗ khó hiểu.

## 7. Lưu game

- Lưu vào IndexedDB, khoá `save:v1`. Gọi `navigator.storage.persist()` để xin lưu bền.
- Nội dung: phiên bản schema, tiến trình chiến dịch (sao từng ngày, huy hiệu khoa), Ngân sách, thiết bị đã mua, số lần và điểm trung bình từng mini-game (để mở tự động hoá), thẻ Sổ tay đã mở, độ khó, cài đặt, lịch sử Ca thử thách, thống kê tổng.
- **Di chuyển phiên bản (migration):** mỗi lần đổi cấu trúc save, tăng `version` và viết hàm `migrate(vN → vN+1)`. Có test cho từng migration.
- **Mã lưu:** JSON → nén (lz-string) → chuỗi base64 có checksum. Người chơi dán vào máy khác để chuyển tiến trình. Không cần tài khoản.
- Lưu ý Safari iOS: trang web không được cài lên màn hình chính có thể bị xoá dữ liệu nếu lâu không mở; game nhắc người chơi "Thêm vào màn hình chính" và "Xuất mã lưu" sau khi xong chương 0.

## 8. PWA, chia sẻ, âm thanh

- **PWA:** manifest (tên, icon, màu, `display: standalone`, `orientation: portrait`), service worker cache toàn bộ tài nguyên; cập nhật phiên bản mới khi người chơi ở màn hình mở đầu (không cập nhật giữa ca).
- **Thẻ chia sẻ:** vẽ ảnh 1080×1350 bằng Canvas 2D từ dữ liệu báo cáo → `Blob` → `navigator.share({ files, text })`; không hỗ trợ thì sao chép văn bản và tải ảnh về. Phông chữ phải tải xong trước khi vẽ (tránh lỗi dấu tiếng Việt).
- **Âm thanh:** Howler.js; "mở khoá" âm thanh ở lần chạm đầu tiên (yêu cầu của trình duyệt di động).

## 9. Đo lường (analytics) — tuỳ chọn, chỉ từ mốc Chơi thử rộng

- Mặc định **không đo gì**. Nếu cần số liệu để biết game có dễ hiểu không, chỉ dùng bộ đếm ẩn danh, không cookie, không định danh người chơi (ví dụ Umami hoặc Plausible tự host).
- Không thu thập dữ liệu cá nhân, đặc biệt vì có người chơi dưới 18 tuổi. Kiểm tra Nghị định 13/2023/NĐ-CP trước khi bật, và ghi rõ trong trang Giới thiệu.
- Sự kiện cần đo: `session_start`, `shift_start {day, room, mode, difficulty}`, `shift_end {day, room, stars, score, trust, duration, quit_early}`, `minigame_end {id, skill}`, `mistake {type}`, `codex_open {card}`, `share_click`, `equipment_buy {id}`, `pwa_install`.
- Từ đó tính: tỷ lệ chơi hết ngày 1, tỷ lệ quay lại sau 1 ngày/7 ngày (D1/D7 retention), ngày người chơi bỏ cuộc nhiều nhất, lỗi sai phổ biến nhất (gợi ý chỗ cần dạy lại), tỷ lệ chia sẻ.

## 10. Cấu trúc thư mục repo

```
ca-truc-labo/
  content/              # dữ liệu game (mục 5)
  src/
    sim/                # lõi mô phỏng, không phụ thuộc gì
      core/             # rng, clock, shift, commands, results, qc (Westgard), scoring, generator
      departments/      # reception, chem, heme, micro, immuno, patho (mỗi khoa: module + rules)
      minigames/        # generate() + score() của 27 mini-game
    store/              # Zustand, vòng lặp tick
    ui/
      screens/          # S1..S14
      components/       # SampleCard, LJChart, Microscope, Plate, ...
      minigames/        # 5 khung: SequenceGame, MicroscopeGame, TimingGame, CompareGame, MeasureGame
      rooms/            # bố cục phòng từng khoa
      theme/            # token màu, phông
    platform/           # storage, pwa, share, audio, analytics
    i18n/
  tools/
    balance-bot/        # bot cân bằng chạy Node
    content-check/      # kiểm tra & xuất/nhập bảng duyệt
  tests/                # Playwright
  docs/                 # bản sao các tài liệu thiết kế này
  .github/workflows/    # CI: lint, typecheck, test, content:check, build, deploy preview
```

## 11. Công cụ cho dev (debug panel)

Chỉ có trong bản dev (bật bằng `?debug=1`): tăng tốc ×10, nhảy tới chương/ngày bất kỳ, mở thẳng một mini-game với hạt giống chọn trước, sinh mẫu theo loại lỗi, ép QC hỏng, hiện thông tin ẩn của mẫu, xuất chuỗi lệnh của ca hiện tại, nạp chuỗi lệnh để phát lại.

## 12. Quy trình phát triển

- Git + GitHub; nhánh chính `main` luôn chạy được; mỗi tính năng một nhánh + PR.
- CI (GitHub Actions): lint (ESLint), format (Prettier), typecheck, Vitest, `content:check`, build; Playwright chạy trên PR vào `main`.
- Mỗi PR có bản xem trước trên Cloudflare Pages để mở bằng điện thoại thật.
- Kiểm thử trên thiết bị thật trước mỗi lần chơi thử: ít nhất 1 iPhone (Safari) và 1 Android tầm trung.

## 13. Để sau (không làm bây giờ)

- Bảng xếp hạng Ca thử thách: Cloudflare Workers + D1 (hoặc Supabase), gửi chuỗi lệnh lên để máy chủ **phát lại và tự tính điểm** (chống gian lận nhờ lõi tất định).
- Đăng nhập tuỳ chọn để đồng bộ save.
- Bản tiếng Anh (chuỗi đã nằm trong file i18n).
