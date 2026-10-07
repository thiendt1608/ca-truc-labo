# Kiến thức làm game cho người mới (dành cho dev backend/AI)

> Phiên bản: 1.2 · Ngày: 2026-10-07
> Mục đích: giúp Thien hiểu các khái niệm, các loại tài liệu và cách làm việc của một dự án game, đủ để đọc bộ tài liệu này và tự đưa ra quyết định.

## 1. Một dự án game cần những tài liệu gì

Studio lớn có hàng chục loại tài liệu. Game indie nhỏ chỉ cần những loại dưới đây; bảng ghi rõ dự án này đã có hay chưa.

| Tài liệu | Trả lời câu hỏi | Dự án này |
|---|---|---|
| **Concept / One-pager / Pitch** | Game là gì, cho ai, vì sao đáng làm (1–3 trang) | `03-concept-v2.md` |
| **GDD — Game Design Document** | Người chơi làm gì, luật chơi, con số, tiến trình | `04-GDD.md` (hệ thống chung) + `04a-GDD-cac-khoa.md` (từng khoa) |
| **Đặc tả nội dung / Domain spec** | Dữ liệu và kiến thức nằm trong game; nguồn sự thật | `05-noi-dung-chuyen-mon.md` |
| **UI/UX spec** | Màn hình, bố cục, thao tác | `06-UI-UX-va-mi-thuat.md` |
| **Art bible / Art direction** | Phong cách hình ảnh, màu, danh sách tài sản | `06-UI-UX-va-mi-thuat.md` (gộp) |
| **Audio spec** | Âm thanh, nhạc, danh sách hiệu ứng | `06-UI-UX-va-mi-thuat.md` (gộp) |
| **TDD — Technical Design Document** | Công nghệ, kiến trúc, dữ liệu, kiểm thử | `07-TDD.md` |
| **Kế hoạch / Roadmap / Milestones** | Làm gì trước, khi nào xong, thế nào là đạt | `08-ke-hoach-du-an.md` |
| **Rủi ro, pháp lý** | Cái gì có thể làm hỏng dự án | `08-ke-hoach-du-an.md` mục 7–8 |
| **Kế hoạch & ghi chép playtest** | Ai chơi thử, quan sát được gì | Mục 4 của kế hoạch; ghi chép sẽ nằm ở `docs/playtest/` |
| **Kịch bản / lời thoại (narrative script)** | Lời nhân vật, văn bản trong game | Chưa cần riêng; viết trong file ngôn ngữ ở giai đoạn P3 |
| **Bảng cân bằng (balancing sheet)** | Con số của từng ngày, giá nâng cấp | Sẽ là các file `content/days/*.json` + kết quả bot |
| **Marketing plan / Press kit** | Ra mắt thế nào, ảnh/clip giới thiệu | Mốc M6 của kế hoạch; làm chi tiết khi gần phát hành |
| Tài liệu không cần cho dự án này | Monetization design (game miễn phí 100%), live-ops plan, localization plan, level design doc chi tiết | Không cần / để sau |

**Lời khuyên chung từ cộng đồng làm game indie:** tài liệu thiết kế là **tài liệu sống**. Viết phần cốt lõi trước (ý tưởng, trụ cột, vòng lặp), chi tiết thêm dần khi đã chơi thử; sửa ngay khi thiết kế đổi, ghi ngày và lý do. Một GDD không ai cập nhật còn tệ hơn không có.

## 2. Từ điển thuật ngữ

| Thuật ngữ | Nghĩa dễ hiểu |
|---|---|
| **Core loop (vòng lặp cốt lõi)** | Hành động người chơi lặp lại nhiều nhất, vài giây một lần. Ở đây: xem mẫu → nhận/từ chối → đặt vào máy. Nếu vòng này không vui, không gì cứu được game. |
| **Meta loop / meta game** | Lớp tiến trình dài hạn bao quanh vòng cốt lõi: ngày, nâng cấp, sưu tập. Lý do quay lại ngày mai. |
| **Design pillars (trụ cột thiết kế)** | 3–4 cảm giác bắt buộc game phải mang lại. Dùng để loại bỏ ý tưởng không phục vụ chúng. |
| **Non-goals** | Những thứ cố ý không làm, viết ra để khỏi bị cám dỗ. |
| **Mini-game** | Một trò nhỏ, ngắn, lồng trong game chính. Ở đây là các thao tác kỹ thuật như nhuộm Gram, cắt microtome. |
| **Chapter (chương)** | Một phần của chiến dịch, ở đây mỗi chương là một khoa. |
| **Content pack / module** | Gói nội dung cắm vào lõi chung; mỗi khoa là một gói. Giúp làm và phát hành từng phần. |
| **Mechanic (cơ chế)** | Một luật chơi cụ thể: "máy ly tâm phải cân bằng". |
| **System (hệ thống)** | Nhiều cơ chế kết hợp: "hệ thống QC". |
| **Onboarding / tutorial** | Cách game dạy người chơi lần đầu. Game tốt dạy bằng cách cho làm, không bằng chữ. |
| **Difficulty curve (đường cong độ khó)** | Độ khó tăng thế nào theo thời gian. Lý tưởng là tăng dần, có lúc nghỉ. |
| **Balancing (cân bằng)** | Chỉnh con số để game vừa sức. |
| **Juice / game feel** | Cảm giác "đã tay": hiệu ứng nhỏ, âm thanh, rung khi làm đúng. Thêm "juice" làm game vui hơn hẳn mà không đổi luật. |
| **Playtest** | Cho người thật chơi và quan sát. |
| **Paper prototype** | Bản chơi thử bằng giấy, bút, thẻ. Rẻ nhất để kiểm tra ý tưởng. |
| **Greybox / whitebox** | Bản chơi được nhưng chỉ có hình khối đơn giản. |
| **Vertical slice** | Một phần nhỏ của game làm hoàn chỉnh như bản cuối. |
| **MVP** | Bản nhỏ nhất đủ để phát hành và đo phản hồi. |
| **Scope creep** | Phạm vi phình to dần vì thêm "chỉ một tính năng nữa". Kẻ thù số một của dự án indie. |
| **Retention (D1, D7)** | % người chơi quay lại sau 1 ngày, 7 ngày. |
| **Session length** | Thời gian một lần chơi. Game điện thoại casual thường vài phút. |
| **Viral loop** | Cơ chế khiến người chơi kéo thêm người chơi (chia sẻ điểm, thách đấu). |
| **Daily challenge** | Một màn chơi giống nhau cho mọi người mỗi ngày (kiểu Wordle). |
| **Seed / seeded RNG** | "Hạt giống" cho bộ sinh số ngẫu nhiên; cùng hạt giống → cùng chuỗi số. |
| **Deterministic simulation** | Mô phỏng tất định: cùng đầu vào → cùng kết quả. |
| **Fixed timestep** | Cập nhật logic theo bước thời gian cố định, không phụ thuộc tốc độ máy. |
| **Asset** | Tài sản: hình, âm thanh, phông, hoạt ảnh. |
| **Sprite** | Hình 2D dùng trong game. |
| **HUD** | Thông tin luôn hiện trên màn hình chơi (giờ, Niềm tin). |
| **PWA** | Web có thể "cài" lên màn hình chính, chạy offline. |
| **Game engine / framework** | Bộ công cụ làm game (Unity, Godot, Phaser). Dự án này không cần engine lớn. |

## 3. Làm game khác làm backend ở đâu

| Backend/AI quen | Trong game |
|---|---|
| Yêu cầu rõ từ người dùng/PM | Yêu cầu là "phải vui", chỉ biết khi chơi thử |
| Test tự động là chính | Test tự động cho logic + **playtest người thật** là bắt buộc |
| Đúng là đủ | Đúng nhưng nhạt là thất bại; cần "juice", nhịp độ |
| Request/response | Vòng lặp liên tục theo thời gian, trạng thái thay đổi mỗi giây |
| Dữ liệu từ người dùng | Dữ liệu chủ yếu là **nội dung do mình thiết kế** (màn chơi, con số) |
| Tối ưu độ trễ máy chủ | Tối ưu khung hình, dung lượng tải, cảm giác phản hồi tức thì |
| Thêm tính năng = thêm giá trị | Thêm tính năng thường làm game rối hơn; **cắt bớt** thường tốt hơn |

Những thứ Thien đã có lợi thế: viết lõi mô phỏng thuần logic, kiểm thử, xử lý dữ liệu nội dung, bot cân bằng, phân tích số liệu playtest, dùng AI để soạn nháp nội dung và lời giải thích.

## 4. Quy trình làm một tính năng game

```
Ý tưởng → viết vào GDD (ngắn) → làm bản thô nhanh → tự chơi
   → chơi thử với người khác → sửa → thêm hình/tiếng/juice → cân bằng số
```

Không làm hình đẹp trước khi luật chơi được chứng minh là vui.

## 5. Tài liệu nên đọc/xem (chọn lọc, theo thứ tự ưu tiên)

| Tài liệu | Vì sao | Thời lượng |
|---|---|---|
| *Game Programming Patterns* — Robert Nystrom (đọc miễn phí tại gameprogrammingpatterns.com) | Các chương Game Loop, Command, Event Queue, Update Method dùng trực tiếp trong TDD | Đọc 4 chương, ~3 giờ |
| Bài nói "Juice it or lose it" — Martin Jonasson & Petri Purho (tìm trên YouTube) | Hiểu "game feel" trong 15 phút | 15 phút |
| *The Art of Game Design: A Book of Lenses* — Jesse Schell | Sách nhập môn thiết kế game kinh điển, đọc theo chương khi cần | Tham khảo |
| *A Theory of Fun for Game Design* — Raph Koster | Vì sao game vui: học và làm chủ khuôn mẫu. Rất hợp với game "học mà không thấy học" | ~3 giờ |
| *The Gamer's Brain* — Celia Hodent | UX cho game, onboarding, tâm lý người chơi | Tham khảo |
| Các bài nói GDC (GDC Vault, nhiều bài miễn phí trên YouTube kênh GDC) | Tìm theo chủ đề "tutorial design", "playtesting", "time management games" | Tuỳ |
| Mẫu GDD cho indie (ví dụ bài "A GDD template for the indie developer" trên Game Developer) | So sánh cấu trúc với GDD của dự án | 20 phút |
| Chơi thử: Tiệm Trà Nhỏ (tiemtranho.com), các game quản lý thời gian (Overcooked, Papers, Please, Diner Dash) | **Papers, Please** đặc biệt liên quan: game "kiểm tra giấy tờ, nhận/từ chối" rất giống khâu nhận mẫu | Vài giờ |

## 6. Nguồn đã tham khảo khi soạn bộ tài liệu

- Cấu trúc GDD và cách giữ tài liệu sống: https://generalistprogrammer.com/tutorials/how-to-write-a-game-design-document · https://www.gamedeveloper.com/design/a-gdd-template-for-the-indie-developer
- Vòng lặp game casual: https://gdevelop.io/blog/casual-game-loops · https://www.gamedeveloper.com/business/the-compulsion-loop-explained
- So sánh Phaser với các framework 2D web (2026): https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework
- Các giai đoạn làm game, milestones: https://ltpf.ramiismail.com/milestones/ · https://www.wayline.io/blog/setting-game-development-milestones-concept-launch
- Trend game mô phỏng nghề: https://cafebiz.vn/nguoi-ban-xoi-nguoi-mo-quan-tra-sua-nguoi-lam-spa-ai-thich-hack-nao-thi-lam-logistic-trao-luu-game-mo-phong-chong-gai-doi-that-khien-ca-mxh-me-man-toi-ngay-176260929164124018.chn · https://tiemtranho.com/
- Quy định game tại Việt Nam (NĐ 147/2024): https://luatvietnam.vn/linh-vuc-khac/kinh-doanh-tro-choi-dien-tu-tren-mang-883-100134-article.html · https://lsvn.vn/phan-loai-game-theo-do-tuoi-tu-25-12-2024-a150127.html
- Nguồn chuyên môn xét nghiệm: xem `05-noi-dung-chuyen-mon.md` mục 10.
