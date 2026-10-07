# CA TRỰC LABO — GDD: thiết kế từng khoa

> Phiên bản: 1.0 · Ngày: 2026-10-07
> Hệ thống dùng chung (tiếp nhận, máy, mini-game, QC, kết quả, chấm điểm): `04-GDD.md`. Dữ liệu chuyên môn (bảng ống, xét nghiệm, giá trị, luật): `05-noi-dung-chuyen-mon.md`.
>
> Mỗi khoa được mô tả theo cùng một khuôn: **Cảm giác chủ đạo · Trạm · Kiểm tra mẫu riêng · Mini-game · QC · Kết quả · Sự kiện riêng · Lịch mở theo ngày · Thiết bị**.
>
> **Mini-game** = một thao tác kỹ thuật ngắn (10–30 giây) làm bằng tay trên màn hình. Mỗi mini-game cho điểm Tay nghề 0–100 và có thể được tự động hoá bằng thiết bị khi đã thành thạo.

---

## 0. Tiếp nhận mẫu (chương 0, 3 ngày)

**Cảm giác:** "Papers, Please" của phòng xét nghiệm — so giấy tờ, phát hiện chỗ sai, chuyển đúng nơi.

**Trạm:** Khay nhận · Bàn kiểm tra · 5 giỏ chuyển khoa · Tủ lạnh lưu mẫu · Điện thoại.

**Lịch mở:**
| Ngày | Mở mới |
|---|---|
| 0.1 | Định danh (2 thông tin), ống máu; chuyển tới Hoá sinh và Huyết học |
| 0.2 | Loại mẫu khác: lọ nước tiểu, lọ phân, que tăm bông, chai cấy máu, lọ mô; chuyển đủ 5 khoa; mẫu để quá giờ |
| 0.3 | Mẫu không lấy lại được (Liên hệ), lọ rò rỉ (an toàn sinh học), cấp cứu dồn |

**Mini-game:** *Dọn đổ vỡ* (dùng chung mọi khoa): kéo lần lượt: rắc chất khử khuẩn → chờ (thanh thời gian) → lau từ ngoài vào trong → bỏ thùng rác y tế. Sai thứ tự → trừ điểm An toàn.

---

## 1. 🧪 Hoá sinh lâm sàng (chương 1, 5 ngày)

**Cảm giác:** chạy đua với máy — nhiều mẫu, máy nhanh, phải để mắt tới chất lượng mẫu và QC.

**Trạm:** Máy ly tâm · Khay sau ly tâm · Máy hoá sinh tự động · Máy đọc nước tiểu (hoặc đọc bằng mắt) · Màn Kết quả.

**Kiểm tra mẫu riêng:**
- Sau ly tâm xem huyết thanh/huyết tương: **tan huyết** (hồng-đỏ, 3 mức +/++/+++), **đục** (mỡ máu), **vàng** (bilirubin cao).
- Tan huyết: từ chối nếu có xét nghiệm bị ảnh hưởng ở mức đó (bảng trong `05`).
- Đục nặng: **Nhận + xử lý** (ly tâm tốc độ cao) — lấy lại máu vẫn đục.
- Vàng: **Nhận** (máy gắn cờ) — lấy lại vẫn vàng.
- Để quá 2 giờ chưa ly tâm: từ chối nếu có Glucose (trừ ống xám NaF) hoặc Kali.
- Ống tím (EDTA) cho HbA1c: đúng — nhưng không ly tâm. Ống tím cho điện giải: sai ống.

**Mini-game:**
| Mini-game | Thao tác | Điểm cao khi | Tự động hoá bằng |
|---|---|---|---|
| **Cân bằng ly tâm** | Đặt ống vào rổ tròn, thêm ống nước cân bằng | Mọi ống có ống đối diện cùng khối lượng | (không — luôn làm tay, thao tác nhanh) |
| **Pha loãng** | Kết quả vượt dải đo (">") → chọn tỉ lệ pha loãng (1:2, 1:5, 1:10), máy chạy lại, nhân lại hệ số | Chọn tỉ lệ nhỏ nhất đưa kết quả vào dải đo; nhân đúng hệ số | Máy tự pha loãng (thiết bị) |
| **Que thử nước tiểu** | Nhúng que → bấm giờ → so từng ô màu với bảng màu đúng thời điểm đọc (ô glucose đọc ở 30 giây, ô bạch cầu ở 2 phút...) | So đúng màu, đọc đúng thời điểm | Máy đọc que nước tiểu |

**QC:** control 2 mức, biểu đồ Levey-Jennings với vạch ±1SD, ±2SD, ±3SD. Luật Westgard: 1-2s (cảnh báo), 1-3s, 2-2s, R-4s (loại); 4-1s, 10x ở mức Khó. Khắc phục: Chạy lại control · Mở lọ control mới · Thay hoá chất · Hiệu chuẩn · Gọi kỹ sư. Mỗi kịch bản có nguyên nhân ẩn (bảng trong `05`).

**Kết quả:** cờ H/L, ‼️ (gọi báo), Δ (delta check, nghi nhầm người), HIL (máy đo chỉ số tan huyết/đục/vàng).

**Sự kiện riêng:** hết hoá chất một xét nghiệm; QC hỏng sau khi thay lô hoá chất mới; kết quả Kali cao bất thường hàng loạt (do mẫu để lâu từ phòng khám vệ tinh).

**Lịch mở:**
| Ngày | Mở mới |
|---|---|
| 1.1 | Ly tâm + cân bằng, máy hoá sinh, duyệt kết quả |
| 1.2 | Tan huyết theo mức và theo xét nghiệm; để quá giờ (ngoại lệ ống xám) |
| 1.3 | QC Westgard (1-2s, 1-3s), khắc phục |
| 1.4 | 2-2s, R-4s; giá trị nguy hiểm ‼️; pha loãng; đục/vàng |
| 1.5 | Que thử nước tiểu; Δ; ngày bận nhất |

**Thiết bị:** Máy ly tâm lớn (12→24) · Máy ly tâm nhanh · Máy tự pha loãng · Máy đọc que nước tiểu · Máy hoá sinh thứ hai.

---

## 2. 🩸 Huyết học – Truyền máu (chương 2, 6 ngày)

**Cảm giác:** hai nửa tương phản — Huyết học là "nhìn tế bào", Truyền máu là "cẩn thận tuyệt đối, một lỗi là chết người".

**Trạm:** Máy đếm tế bào máu · Bàn kéo lam + nhuộm · Kính hiển vi · Máy đông máu · Bàn định nhóm máu · Tủ trữ máu (2–6°C) · Quầy phát máu.

**Kiểm tra mẫu riêng:**
- Ống tím (EDTA) cho công thức máu: có cục đông → từ chối.
- Ống xanh dương (citrate) cho đông máu: phải đủ đến vạch (tỉ lệ máu:chống đông 9:1); thiếu → từ chối.
- Mẫu định nhóm máu: **không chấp nhận bất kỳ sai sót định danh nào** (dù chỉ thiếu năm sinh), đây là luật nghiêm nhất game.

**Mini-game:**
| Mini-game | Thao tác | Điểm cao khi | Tự động hoá bằng |
|---|---|---|---|
| **Kéo lam máu** | Nhỏ giọt máu, đặt lam kéo nghiêng, vuốt một đường đều | Góc ~30–45°, tốc độ đều → lam có "đuôi" mỏng dần, không rách | Máy kéo và nhuộm lam tự động |
| **Đếm công thức bạch cầu** | Soi lam (cuộn vi trường), chạm từng bạch cầu và chọn loại (trung tính, lympho, mono, ưa acid, ưa base); đếm đủ 20 (Thường) / 50 (Khó) | Phân loại đúng; phát hiện tế bào lạ ("tế bào non") → gắn cờ chuyển bác sĩ | (không — chỉ cần khi máy đếm gắn cờ) |
| **Định nhóm máu ABO/Rh** | Nhỏ huyết thanh mẫu anti-A, anti-B, anti-D vào hồng cầu bệnh nhân (định nhóm xuôi) và nhỏ huyết thanh bệnh nhân vào hồng cầu mẫu A, B (định nhóm ngược); lắc; đọc ngưng kết/không | Đọc đúng, kết luận đúng; phát hiện xuôi–ngược không khớp → làm lại/báo | Hệ thống định nhóm bằng thẻ gel |
| **Phản ứng chéo** | Trộn huyết thanh người nhận với hồng cầu túi máu, ủ, ly tâm, đọc | Đọc đúng có/không ngưng kết | Hệ thống gel |
| **Chọn và phát túi máu** | Chọn túi trong tủ: đúng nhóm hoặc nhóm hoà hợp, còn hạn, túi không rò/không đổi màu; đối chiếu to với điều dưỡng nhận máu | Túi hoà hợp, ưu tiên cùng nhóm, ưu tiên túi gần hết hạn; đối chiếu đủ | (không — luôn làm tay vì là bước an toàn) |

**QC:** máu chứng 3 mức cho máy đếm (biểu đồ đơn giản); kiểm tra huyết thanh mẫu mỗi sáng (anti-A + hồng cầu A phải ngưng kết, anti-A + hồng cầu B không).

**Kết quả:** máy đếm có cờ "Cần xem lam" (nghi tế bào bất thường, tiểu cầu thấp giả do vón) → phải kéo lam và soi trước khi gửi. Đông máu: INR, APTT; ‼️ khi INR rất cao.

**Sự kiện riêng:** 🚑 **Truyền máu khối lượng lớn**: cấp cứu cần máu ngay, chưa kịp định nhóm → phát **hồng cầu nhóm O** (luật cấp cứu) rồi định nhóm sau · tủ máu báo nhiệt độ cao → kiểm tra · túi máu sắp hết nhóm O → gọi trung tâm máu (mất Ngân sách).

**Lịch mở:**
| Ngày | Mở mới |
|---|---|
| 2.1 | Máy đếm, QC máu chứng |
| 2.2 | Cờ "Cần xem lam" → kéo lam, đếm công thức bạch cầu |
| 2.3 | Đông máu: ống citrate 9:1, INR, APTT |
| 2.4 | Định nhóm ABO/Rh xuôi + ngược; luật định danh nghiêm ngặt |
| 2.5 | Phản ứng chéo, chọn và phát túi máu |
| 2.6 | Truyền máu cấp cứu (nhóm O), ngày bận nhất |

**Thiết bị:** Máy kéo/nhuộm lam tự động · Hệ thống gel định nhóm · Máy đếm thứ hai · Tủ máu lớn.

---

## 3. 🦠 Vi sinh – Ký sinh trùng (chương 3, 6 ngày)

**Cảm giác:** kiên nhẫn và nhiều ngày — việc hôm nay cho kết quả ngày mai; soi kính tìm "kho báu" nhỏ xíu.

**Trạm:** Tủ an toàn sinh học · Kệ môi trường (đĩa thạch) · Tủ ấm 35–37°C (thường và CO₂) · Bàn nhuộm · Kính hiển vi · Bàn kháng sinh đồ · Máy cấy máu tự động.

**Kiểm tra mẫu riêng:**
- Que tăm bông khô, lọ không vô trùng, nước tiểu để ở nhiệt độ phòng quá 2 giờ → từ chối.
- Mở mẫu **chỉ trong tủ an toàn sinh học** (bấm "Mở tủ" trước).
- Mẫu phân cho ký sinh trùng: soi càng sớm càng tốt; phân lỏng để lâu có thể làm mất thể hoạt động.

**Mini-game:**
| Mini-game | Thao tác | Điểm cao khi | Tự động hoá bằng |
|---|---|---|---|
| **Chọn môi trường** | Chọn đĩa thạch theo loại mẫu (thạch máu, MacConkey, thạch chocolate; chai cấy máu) | Chọn đúng bộ môi trường | (không) |
| **Cấy ria 4 vùng** | Vẽ đường zig-zag ở vùng 1, xoay đĩa, kéo từ vùng 1 sang vùng 2, 3, 4 | Đủ 4 vùng, không cày lại vùng cũ → hôm sau có khuẩn lạc riêng lẻ | Máy cấy tự động |
| **Đọc đĩa** (ngày hôm sau) | Xem khuẩn lạc: màu, kích thước, vòng tan máu (beta: trong suốt; alpha: xanh lục; gamma: không), màu hồng trên MacConkey (lên men lactose) | Chọn đúng khuẩn lạc nghi ngờ để làm tiếp; nhận ra đĩa "tạp nhiễm" | (không) |
| **Nhuộm Gram** | Kéo 4 lọ theo đúng thứ tự: tím tinh thể → lugol → **tẩy cồn (giữ nút đúng thời gian)** → fuchsin/safranin; rồi soi | Đúng thứ tự; tẩy vừa đủ (lâu quá → tất cả hồng; ngắn quá → tất cả tím) | Máy nhuộm Gram tự động |
| **Soi Gram** | Nhìn vi trường: chọn Gram dương (tím) / âm (hồng) + hình dạng (cầu chùm, cầu chuỗi, trực khuẩn) | Phân loại đúng | (không) |
| **Catalase** | Nhỏ H₂O₂ lên khuẩn lạc, quan sát sủi bọt | Đọc đúng (có bọt → dương) | (không) |
| **Kháng sinh đồ** | Trải vi khuẩn lên đĩa Mueller-Hinton, đặt các khoanh kháng sinh, ủ; ngày sau đo đường kính vòng vô khuẩn bằng thước và tra bảng S/I/R | Đo đúng (±1 mm), tra đúng | Máy kháng sinh đồ tự động |
| **Soi phân tìm trứng giun** | Kéo vi trường trên lam phân (nước muối/lugol), chạm khi thấy trứng, chọn loại (giun đũa, giun tóc, giun móc...) | Tìm đủ, nhận đúng; không nhầm bọt khí/hạt thức ăn | (không) |
| **Soi máu tìm ký sinh trùng sốt rét** | Lam giọt dày (để phát hiện) và giọt mỏng (để định loài); cuộn qua các vi trường | Không kết luận âm tính trước khi soi đủ số vi trường (thanh đếm); nhận đúng thể ký sinh trùng | (không) |

**QC:** chủng chuẩn kiểm tra môi trường và kháng sinh đồ (vòng vô khuẩn của chủng chuẩn phải nằm trong khoảng cho phép), thuốc nhuộm Gram kiểm tra bằng lam chứng có cả vi khuẩn Gram dương và âm.

**Kết quả:** vi sinh trả nhiều giai đoạn: "Nhuộm Gram sơ bộ" → "Đã định danh" → "Kháng sinh đồ". **Cấy máu dương tính** và **ký sinh trùng sốt rét dương tính** là ‼️ — gọi báo ngay.

**Việc tồn qua ngày (do cấu hình ngày):** sáng nào cũng có đĩa cấy "từ hôm qua" trong tủ ấm chờ đọc; đĩa kháng sinh đồ chờ đo; chai cấy máu đang theo dõi.

**Sự kiện riêng:** chai cấy máu báo dương lúc 2 giờ sáng (chương 6) · tủ ấm hỏng nhiệt độ · đĩa bị nấm mốc tạp nhiễm · bệnh nhân sốt từ vùng có sốt rét → mẫu máu cấp cứu.

**Lịch mở:**
| Ngày | Mở mới |
|---|---|
| 3.1 | Tủ an toàn sinh học, chọn môi trường, cấy ria |
| 3.2 | Đọc đĩa hôm qua, nhuộm Gram, soi Gram |
| 3.3 | Catalase, định danh sơ bộ theo sơ đồ |
| 3.4 | Kháng sinh đồ; cấy máu dương tính ‼️ |
| 3.5 | Ký sinh trùng: soi phân |
| 3.6 | Sốt rét giọt dày/giọt mỏng; ngày bận nhất |

**Thiết bị:** Máy nhuộm Gram tự động · Máy cấy tự động · Máy kháng sinh đồ tự động · Tủ ấm lớn · Máy cấy máu thứ hai.

---

## 4. 🧫 Miễn dịch (chương 4, 5 ngày)

**Cảm giác:** đọc tín hiệu — vạch mờ hay không có, màu đậm hay nhạt, và biết **khi nào kết quả không hợp lệ**.

**Trạm:** Bàn test nhanh (có đồng hồ hẹn giờ) · Bàn ELISA (đĩa giếng, máy rửa, máy đọc) · Máy miễn dịch tự động · Màn Kết quả.

**Kiểm tra mẫu riêng:** đúng loại mẫu cho từng test (máu toàn phần/huyết thanh/que mũi họng), mẫu không tan huyết nặng với test huyết thanh.

**Mini-game:**
| Mini-game | Thao tác | Điểm cao khi | Tự động hoá bằng |
|---|---|---|---|
| **Test nhanh** | Nhỏ đúng số giọt mẫu + dung dịch đệm, bấm giờ, đọc khi đủ thời gian (không sớm, không quá muộn) | Đọc đúng: chỉ vạch C → âm tính; C + T (kể cả T mờ) → dương tính/phản ứng; không có C → **không hợp lệ**, làm lại test mới | (không) |
| **ELISA** | Nạp chứng âm, chứng dương, mẫu vào giếng theo sơ đồ → ủ → rửa → cộng hợp → rửa → cơ chất → dung dịch dừng → đọc mật độ quang (OD) | Nạp đúng giếng; không bỏ bước rửa; chứng đạt; tính đúng S/CO = OD mẫu ÷ ngưỡng (≥ 1: phản ứng) | Máy ELISA tự động |
| **Vùng xám** | Mẫu có S/CO gần ngưỡng (0,9–1,1) → quyết định: làm lại lặp đôi | Không vội trả kết quả với mẫu vùng xám | (không) |

**QC:** máy miễn dịch tự động dùng Westgard như Hoá sinh. ELISA/test nhanh: chứng âm, chứng dương mỗi lượt — chứng sai → cả lượt không hợp lệ.

**Kết quả — luật "sàng lọc và khẳng định":** test sàng lọc **phản ứng** không phải chẩn đoán. Với một số xét nghiệm (ví dụ viêm gan), kết quả phản ứng phải **gửi xét nghiệm khẳng định** hoặc ghi "phản ứng — đề nghị khẳng định"; viết "Bệnh nhân bị viêm gan" là lỗi.

**Sự kiện riêng:** mùa sốt xuất huyết — mẫu sốt xuất huyết dồn về · máy rửa ELISA tắc kim (giếng không được rửa → OD cao giả) · lô test nhanh mới cần kiểm tra bằng chứng trước khi dùng.

**Lịch mở:**
| Ngày | Mở mới |
|---|---|
| 4.1 | Test nhanh: C/T, đọc đúng thời điểm, không hợp lệ |
| 4.2 | Máy miễn dịch tự động (dùng lại QC Westgard) |
| 4.3 | ELISA: sơ đồ giếng, chứng, rửa |
| 4.4 | S/CO, vùng xám, sàng lọc và khẳng định |
| 4.5 | Mùa sốt xuất huyết, ngày bận nhất |

**Thiết bị:** Máy ELISA tự động · Máy đọc test nhanh · Máy miễn dịch thứ hai.

---

## 5. 🔬 Giải phẫu bệnh – Tế bào học (chương 5, 5 ngày)

**Cảm giác:** khéo tay và chậm mà chắc — mỗi mẫu mô là **duy nhất**, không thể lấy lại.

**Trạm:** Bàn nhận lọ mô · Tủ hút khí độc (formalin) · Máy xử lý mô (chạy qua đêm) · Bàn đúc khối nến · Máy cắt microtome + bể nước ấm · Dàn nhuộm · Kính hiển vi · Máy cắt lạnh (cryostat) · Tủ lưu khối nến và tiêu bản.

**Kiểm tra mẫu riêng:**
- Lọ mô: nhãn khớp phiếu, phiếu ghi vị trí lấy mẫu, **formalin 10% đủ (khoảng 10 lần thể tích mô)**, mô ngập hoàn toàn.
- Lỗi ở mẫu mô → **Liên hệ** (gọi khoa gửi), thêm formalin nếu thiếu, ghi chú — **không bao giờ từ chối hay vứt mẫu mô**.
- Mở lọ formalin chỉ trong tủ hút (bấm "Bật tủ hút").

**Mini-game:**
| Mini-game | Thao tác | Điểm cao khi | Tự động hoá bằng |
|---|---|---|---|
| **Đúc khối nến** | Đặt mảnh mô (đã xử lý qua đêm) vào khuôn, xoay đúng mặt cắt xuống đáy, rót nến, làm lạnh | Đúng hướng mặt cắt; không bọt | Trạm đúc tự động |
| **Cắt microtome** | Vuốt đều theo nhịp để quay tay cắt; giữ độ dày 4–5 µm; vớt dải mô lên bể nước 40–45°C, dán lên lam | Nhịp đều → dải mô liền, phẳng; nhanh quá → rách; nóng quá → mô nát | (không — kỹ năng cốt lõi của khoa) |
| **Nhuộm H&E** | Kéo giá lam qua các bể theo thứ tự: xylen (khử nến) → cồn → nước → **hematoxylin** → rửa → làm xanh → **eosin** → cồn → xylen → dán lamen | Đúng thứ tự, đúng thời gian → nhân xanh tím, bào tương hồng | Máy nhuộm H&E tự động |
| **Kiểm tra tiêu bản** | Nhìn lam: nếp gấp, bọt khí, nhuộm nhạt/đậm | Nhận ra lam lỗi → cắt/nhuộm lại trước khi gửi bác sĩ | (không) |
| **Sàng lọc tế bào học** | Cuộn qua các vi trường của lam tế bào (ví dụ phết cổ tử cung), đánh dấu tế bào "đáng ngờ" (nhân to, sẫm màu, hình dạng bất thường); đánh giá lam có đủ tế bào không | Đánh dấu đủ tế bào đáng ngờ, ít đánh dấu nhầm; nhận ra lam không đủ chất lượng → yêu cầu lấy lại | (không) |
| **Cắt lạnh** | Mẫu từ phòng mổ: đặt vào cryostat, cắt, nhuộm nhanh, giao bác sĩ — tất cả trong ~20 phút game | Kịp giờ, lát cắt đẹp | (không) |

**QC:** lam chứng nhuộm H&E mỗi ngày (nhân xanh tím rõ, bào tương hồng).

**Kết quả:** KTV **không** đọc kết quả mô bệnh học; người chơi giao tiêu bản cho bác sĩ. Với tế bào học, người chơi "sàng lọc" và chuyển lam có đánh dấu; bác sĩ xác nhận (game chấm điểm dựa trên đánh dấu đúng/sai, không gọi tên bệnh).

**Việc tồn qua ngày (do cấu hình ngày):** sáng có khối mô đã xử lý qua đêm chờ đúc; tối (cuối ca) phải nạp mô đã cố định đủ thời gian vào máy xử lý. Mô cố định chưa đủ giờ mà nạp → tiêu bản xấu hôm sau.

**Sự kiện riêng:** 🔪 **Phòng mổ gọi cắt lạnh** (đồng hồ 20 phút, bác sĩ phẫu thuật đang chờ) · lọ mô đến không có formalin · máy xử lý mô báo lỗi giữa đêm (chương 6) · hai lọ cùng tên khác năm sinh.

**Lịch mở:**
| Ngày | Mở mới |
|---|---|
| 5.1 | Nhận lọ mô, formalin, tủ hút, luật "không vứt mẫu mô", nạp máy xử lý |
| 5.2 | Đúc khối nến, cắt microtome |
| 5.3 | Nhuộm H&E, kiểm tra tiêu bản, QC lam chứng |
| 5.4 | Tế bào học: sàng lọc lam |
| 5.5 | Cắt lạnh, ngày bận nhất |

**Thiết bị:** Máy nhuộm H&E tự động · Trạm đúc tự động · Máy xử lý mô thứ hai · Microtome bán tự động (dung sai nhịp rộng hơn).

---

## 6. 🌙 Ca trực đêm tổng hợp (chương 6, 5 ngày)

**Cảm giác:** một mình trông cả phòng xét nghiệm. Mỗi khoa có ít mẫu hơn, nhưng phải tự chọn phòng nào xử lý trước.

- Thanh chọn phòng ở trên cùng; phòng có việc gấp (‼️, cấp cứu, máy báo lỗi, phòng mổ gọi) nhấp nháy.
- Ca đêm rút gọn 19:00–07:00 (vẫn 6–8 phút thực).
- Mỗi ngày nhấn mạnh 1–2 khoa:

| Ngày | Điểm nhấn |
|---|---|
| 6.1 | Hoá sinh + Huyết học (cấp cứu đêm thông thường) |
| 6.2 | Truyền máu: tai nạn giao thông, truyền máu khối lượng lớn |
| 6.3 | Vi sinh: chai cấy máu báo dương lúc 2 giờ sáng; sốt rét |
| 6.4 | Miễn dịch + Giải phẫu bệnh: mùa sốt xuất huyết; máy xử lý mô báo lỗi |
| 6.5 | **"Đêm dài nhất"**: mọi thứ, mất điện ngắn lúc 3 giờ sáng |

- Kết thúc chương = kết thúc chiến dịch: đánh giá năm đầu.

---

## 7. Tổng hợp mini-game

| Khoa | Mini-game | Có thể tự động hoá |
|---|---|---|
| Chung | Dọn đổ vỡ | Không |
| Hoá sinh | Cân bằng ly tâm · Pha loãng · Que thử nước tiểu | Pha loãng, Nước tiểu |
| Huyết học – Truyền máu | Kéo lam · Đếm bạch cầu · Định nhóm ABO/Rh · Phản ứng chéo · Phát túi máu | Kéo lam, Định nhóm, Phản ứng chéo |
| Vi sinh – KST | Chọn môi trường · Cấy ria · Đọc đĩa · Nhuộm Gram · Soi Gram · Catalase · Kháng sinh đồ · Soi phân · Soi sốt rét | Cấy ria, Nhuộm Gram, Kháng sinh đồ |
| Miễn dịch | Test nhanh · ELISA · Vùng xám | ELISA |
| GPB – TBH | Đúc nến · Cắt microtome · Nhuộm H&E · Kiểm tra tiêu bản · Sàng lọc tế bào · Cắt lạnh | Đúc nến, Nhuộm H&E |

Tổng: 27 mini-game. **Nhiều mini-game dùng chung một "khung"** để giảm công làm (xem `07-TDD.md` mục 4.8):
- *Kéo đúng thứ tự* (Nhuộm Gram, Nhuộm H&E, Dọn đổ vỡ, ELISA)
- *Soi kính hiển vi — cuộn và chạm* (Đếm bạch cầu, Soi Gram, Soi phân, Soi sốt rét, Sàng lọc tế bào, Kiểm tra tiêu bản)
- *Giữ đúng thời gian/nhịp* (tẩy cồn Gram, Cắt microtome, Kéo lam)
- *So sánh và đọc* (Que nước tiểu, Test nhanh, Định nhóm, Phản ứng chéo, Đọc đĩa, Catalase)
- *Đo và tra bảng* (Kháng sinh đồ, Pha loãng, ELISA S/CO)
