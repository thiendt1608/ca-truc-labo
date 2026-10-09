# Kế hoạch dự án CA TRỰC LABO

> Phiên bản: 2.0 · Ngày: 2026-10-07
> **Đã chốt với Thien:** không có hạn chót (kế hoạch chia theo **mốc**, làm xong mốc này mới sang mốc sau); miễn phí 100%; người chơi từ 13 tuổi; 5 chuyên ngành + Tiếp nhận; kiến thức theo giáo trình và tài liệu quốc tế, đơn giản hoá, không cần chuyên gia duyệt.

## 1. Cách làm game khác làm phần mềm thường ở đâu

Phần mềm hỏi "có chạy đúng không". Game phải hỏi thêm **"có vui không"**, và chỉ trả lời được bằng cách **cho người thật chơi**. Mỗi mốc kiểm chứng một giả thuyết, rẻ trước, đắt sau.

> **Greybox/hộp xám** = bản chơi được nhưng chỉ có hình khối đơn giản, để thử luật chơi trước khi tốn công vẽ.
> **Vertical slice** = một lát cắt nhỏ của game làm hoàn chỉnh như bản cuối (hình, tiếng, cân bằng).

## 2. Chiến lược: làm lõi chung trước, mỗi khoa là một "gói" cắm thêm

Game giờ có 6 khu và 27 mini-game — quá lớn để làm một lần. Cách giảm rủi ro:
1. **Lõi chung** (tiếp nhận, máy, QC, kết quả, chấm điểm, lưu game) làm một lần, dùng cho mọi khoa.
2. **5 khung mini-game** (kéo đúng thứ tự, soi kính hiển vi, giữ nhịp, so sánh và đọc, đo và tra bảng) làm một lần; mỗi mini-game cụ thể chỉ là dữ liệu + hình (`04a` mục 7, `07-TDD.md` mục 4.8).
3. **Mỗi khoa là một gói nội dung**: luật, dữ liệu, bố cục phòng, hình, 5–6 ngày chiến dịch.
4. **Phát hành theo phần** (mặc định): bản đầu tiên có Tiếp nhận + Hoá sinh + Huyết học – Truyền máu; mỗi bản cập nhật thêm một khoa. Người chơi có game sớm, Thien có góp ý sớm, và nếu dừng giữa chừng thì vẫn có một game hoàn chỉnh. (Nếu Thien muốn phát hành một lần khi đủ 5 khoa, chỉ cần gộp M4–M8 rồi mới làm M-PH.)

## 3. Các mốc và điều kiện qua mốc

| Mốc | Kết quả chính | Điều kiện qua mốc |
|---|---|---|
| **M0. Tài liệu** ✅ | Bộ tài liệu này | Thien đã đọc và chốt các câu hỏi (mục 9) |
| **M1. Thử bằng giấy** | Prototype giấy: tiếp nhận + hoá sinh; 3 mini-game bằng giấy (thứ tự nhuộm Gram, đọc bảng định nhóm máu, đọc test nhanh); wireframe | ≥3/5 người chơi thử (có học sinh 13–16 tuổi) muốn chơi tiếp; người chưa biết gì hiểu luật sau 1 lượt |
| **M2. Hộp xám: lõi + Hoá sinh** | Repo, CI, lõi mô phỏng, Tiếp nhận + Hoá sinh chơi được trên điện thoại; khung mini-game "kéo đúng thứ tự" và "giữ nhịp" | 5 người chơi thử; vòng lặp cốt lõi được đánh giá "vui"; tự hiểu cách chơi ngày đầu |
| **M3. Vertical slice: chương 0–1** | Chương 0 và 1 hoàn chỉnh: QC Westgard, pha loãng, que nước tiểu, sự kiện, báo cáo, Sổ tay, lưu game, PWA, hình và tiếng thật, 3 mức độ khó | Người lạ chơi hết chương 1 không cần hỗ trợ; chạy mượt trên điện thoại tầm trung |
| **M4. Chương 2: Huyết học – Truyền máu** | Khung "soi kính hiển vi" và "so sánh và đọc"; kéo lam, đếm bạch cầu, đông máu, định nhóm, phản ứng chéo, phát máu | Chơi thử 8–10 người; không ai phát nhầm máu mà không hiểu vì sao |
| **M-PH. Phát hành bản 1.0** (Chương 0–2) | Ca tự do, Ca thử thách (Hoá sinh/Huyết học), thẻ chia sẻ, thiết bị, trang giới thiệu | Danh sách pháp lý (mục 7) hoàn tất; chơi thử rộng 20–50 người đạt chỉ số mục 6 |
| **M5. Chương 3: Vi sinh – Ký sinh trùng** (bản 1.1) | Khung "đo và tra bảng"; cấy ria, đọc đĩa, Gram, catalase, kháng sinh đồ, soi phân, sốt rét; việc tồn qua ngày | Chơi thử; người chơi hiểu "kết quả hôm nay là việc của hôm qua" |
| **M6. Chương 4: Miễn dịch** (bản 1.2) | Test nhanh, ELISA, máy miễn dịch, sàng lọc – khẳng định | Chơi thử; người chơi đọc đúng "không hợp lệ" |
| **M7. Chương 5: Giải phẫu bệnh – Tế bào học** (bản 1.3) | Lọ mô, đúc nến, microtome, H&E, tế bào học, cắt lạnh | Chơi thử; mini-game microtome mượt trên máy yếu |
| **M8. Chương 6: Ca trực đêm tổng hợp** (bản 2.0) | Chuyển phòng, ca đêm, Ca thử thách tổng hợp, kết thúc chiến dịch | Chơi thử; ca tổng hợp "hỗn loạn mà vẫn kiểm soát được" |
| **M9. Sau đó** | Theo góp ý: Sinh học phân tử, chế độ Trưởng labo, tiếng Anh... | — |

**Nguyên tắc dừng:** nếu sau M2 vòng lặp cốt lõi không vui hoặc người mới không hiểu, **dừng và sửa thiết kế** trước khi làm hình đẹp hay thêm khoa.

## 4. Công việc chi tiết

### M1. Thử bằng giấy
- [ ] M1-1 Gửi `03-concept-v2.md` cho bạn sinh viên xét nghiệm đọc qua (không bắt buộc).
- [ ] M1-2 Prototype giấy tiếp nhận + hoá sinh: ~30 thẻ mẫu, tờ "phòng làm việc", đồng hồ bấm giờ; một người đóng vai "máy".
- [ ] M1-3 Ba mini-game giấy: xếp 4 lọ nhuộm Gram đúng thứ tự (có hẹn giờ tẩy màu); bảng định nhóm máu (thẻ hình ngưng kết); thẻ test nhanh (C, C+T, T mờ, không có C).
- [ ] M1-4 Chơi thử với 5 người: ≥2 học sinh 13–16 tuổi, ≥2 người lớn ngoài ngành.
- [ ] M1-5 Wireframe Figma: phòng Hoá sinh, thẻ mẫu, QC, kết quả, khung mini-game, báo cáo.
- [ ] M1-6 Cập nhật GDD theo kết quả.

### M2. Hộp xám: lõi + Hoá sinh
- [ ] M2-1 Khởi tạo repo theo `07-TDD.md` mục 10: Vite + React + TS, ESLint/Prettier, Vitest, GitHub Actions, bản xem trước tự động.
- [ ] M2-2 `sim/core`: PRNG có hạt giống, đồng hồ, trạng thái ca, hàng đợi theo thời gian, khung `DepartmentModule`.
- [ ] M2-3 `content/common` + `content/chem`, kiểm tra bằng Zod.
- [ ] M2-4 Module Tiếp nhận: định danh, loại mẫu, chuyển khoa, mẫu không lấy lại được.
- [ ] M2-5 Module Hoá sinh: ly tâm + cân bằng, chất lượng mẫu sau ly tâm, máy hoá sinh, sinh kết quả, màn Kết quả.
- [ ] M2-6 Khung mini-game `SequenceGame` + `TimingGame` (dùng cho Dọn đổ vỡ, Cân bằng ly tâm).
- [ ] M2-7 Niềm tin, chấm điểm 4 tiêu chí, báo cáo thô.
- [ ] M2-8 Giao diện hộp xám; debug panel.
- [ ] M2-9 Test tất định + kịch bản ngày 0.1, 1.1.
- [ ] M2-10 Chơi thử 5 người.

### M3. Vertical slice: chương 0–1
- [ ] M3-1 QC Westgard (biểu đồ Levey-Jennings, kịch bản nguyên nhân, khắc phục, hậu quả trễ) — dùng lại cho Huyết học và Miễn dịch sau này.
- [ ] M3-2 Giá trị nguy hiểm, gọi báo, Δ, HIL; pha loãng; que nước tiểu (`CompareGame` bản đầu).
- [ ] M3-3 Sự kiện chung E1–E10; điện thoại.
- [ ] M3-4 Cấu hình 8 ngày (chương 0–1); hướng dẫn của chị Hạnh.
- [~] M3-5 Hình ảnh thật cho Tiếp nhận + Hoá sinh; âm thanh. **Hoãn**: bỏ khỏi M3, làm sau khi game ổn định (giữ CSS/emoji, chưa có âm thanh).
- [x] M3-6 Sổ tay (33 thẻ Tiếp nhận + Hoá sinh: % sưu tập tổng/theo khoa, lọc + tìm kiếm, gợi ý "Mở khi ..." cho thẻ khoá, dấu "Mới" tới khi đọc (SaveData v3 `codexSeen`), nút "?" ngữ cảnh mở thẻ liên quan và dừng giờ); 3 mức độ khó theo `content/common/difficulty.json` (đồng hồ 0,6/1/1,2×, Niềm tin tối thiểu 30, gợi ý ở Dễ, lỗi tinh vi ít/vừa/nhiều, Westgard nâng cao không/4-1s/4-1s+10x, vùng giữ và bẫy dọn đổ vỡ theo mức); `pnpm balance --difficulty all` kiểm expert ≥4★, idle 1★, novice Dễ ≥ Thường ≥ Khó. Phần chưa làm vì chưa có khoa: kháng nguyên yếu D, ký sinh trùng mật độ thấp, vạch T mờ, khuẩn lạc lẫn.
- [x] M3-7 Lưu game, mã lưu (`CTL1.`), màn Cài đặt, nhắc lưu bền sau ngày 0.3, PWA (manifest, icon, service worker offline, bản mới chỉ nhắc ở Sảnh/Cài đặt); `prefers-reduced-motion` + công tắc Giảm chuyển động, focus-visible. Chế độ chữ lớn để sau.
- [ ] M3-8 Kiểm tra trên điện thoại thật; chơi thử 8–10 người.

### M4. Chương 2: Huyết học – Truyền máu
- [ ] M4-1 Khung `MicroscopeGame` (Canvas 2D, vi trường theo hạt giống).
- [ ] M4-2 Máy đếm + QC máu chứng; cờ "Cần xem lam"; kéo lam; đếm bạch cầu.
- [ ] M4-3 Đông máu (ống citrate 9:1, INR, APTT).
- [ ] M4-4 Định nhóm ABO/Rh xuôi–ngược; QC huyết thanh mẫu; phản ứng chéo; tủ máu; phát máu; truyền máu cấp cứu nhóm O.
- [ ] M4-5 Cấu hình 6 ngày; anh Minh; hình, tiếng, thẻ Sổ tay; thiết bị tự động hoá của khoa.
- [ ] M4-6 Chơi thử.

### M-PH. Phát hành bản 1.0
- [ ] PH-1 Ca tự do; Ca thử thách hằng ngày (Hoá sinh/Huyết học xoay vòng); thẻ chia sẻ.
- [ ] PH-2 Bot cân bằng cho chương 0–2.
- [ ] PH-3 Chơi thử rộng 20–50 người (có thể bật bộ đếm ẩn danh).
- [ ] PH-4 Danh sách pháp lý (mục 7); trang giới thiệu, miễn trừ, CREDITS.
- [ ] PH-5 3–5 clip ngắn; đăng nhóm học sinh/sinh viên ngành y, nhóm KTV, nhóm game web Việt Nam.

### M5–M8 (mỗi khoa cùng một khuôn)
- [ ] Khung mini-game mới nếu cần (M5: `MeasureGame`).
- [ ] Module khoa: luật, trạm, QC riêng, kết quả, sự kiện riêng.
- [ ] Nội dung: `content/<khoa>`, 5–6 file cấu hình ngày (có `carryover` cho Vi sinh và GPB).
- [ ] Người hướng dẫn, hình, tiếng, thẻ Sổ tay, thiết bị.
- [ ] Bot cân bằng cho chương mới; chơi thử; phát hành bản cập nhật.
- M8 thêm: thanh chuyển phòng, ca đêm, nhịp nhấp nháy phòng gấp, Ca thử thách tổng hợp (Chủ nhật), kết thúc chiến dịch.

## 5. Kế hoạch chơi thử

- **Ai:** mỗi vòng có học sinh 13–16 tuổi, người lớn ngoài ngành, và nếu có thể một người trong ngành y.
- **Cách làm:** đưa điện thoại, nói "chơi thử đi", **không giải thích**, không giúp. Ghi lại chỗ khựng lại, cười, bực, muốn bỏ. Chơi từ xa: quay màn hình và nói to suy nghĩ.
- **Sau khi chơi hỏi 5 câu:** (1) Bạn nghĩ mình phải làm gì? (2) Lúc nào vui nhất, khó chịu nhất? (3) Chỗ nào không hiểu vì sao sai? (4) Muốn chơi tiếp không? (1–5) (5) Có học được điều gì mới không? Là gì?
- Câu (5) đặc biệt quan trọng: kiểm tra mục tiêu "học qua quá trình chơi".
- Ghi vào `docs/playtest/vong-N.md`.

## 6. Chỉ số thành công (để biết game có vui và dễ hiểu)

| Chỉ số | Mục tiêu khi chơi thử rộng |
|---|---|
| Chơi hết ngày đầu tiên | ≥ 70% người mở game |
| Học sinh 13–16 tuổi tự chơi hết chương 0 | Đa số |
| Chơi hết một chương | ≥ 30% |
| Điểm "muốn chơi tiếp" | ≥ 4/5 trung bình |
| Kể lại được ít nhất 1 điều học được (câu 5) | ≥ 70% người chơi thử |
| Chia sẻ ít nhất 1 lần | ≥ 10% người chơi hết một ca |

## 7. Pháp lý và an toàn (trước khi phát hành công khai)

- [ ] **Nghị định 147/2024/NĐ-CP** về trò chơi điện tử trên mạng: xác định nhóm (G1–G4) và thủ tục, **kể cả game miễn phí**. Hỏi luật sư/đơn vị tư vấn trước M-PH. Không cần cho chơi thử với người quen.
- [ ] **Tự phân loại độ tuổi** (hướng tới 12+) và hiển thị biểu tượng theo quy định.
- [ ] **Giới hạn thời gian chơi với người dưới 18 tuổi** nếu quy định áp dụng cho loại game này.
- [ ] **Bảo vệ dữ liệu (Nghị định 13/2023/NĐ-CP):** không thu thập dữ liệu cá nhân; bộ đếm (nếu có) chỉ ẩn danh, ghi rõ trong trang Giới thiệu.
- [ ] **Không quảng cáo, không đường link ra ngoài** trong màn chơi.
- [ ] **Tên game:** tra cứu trùng nhãn hiệu (Cục Sở hữu trí tuệ) trước khi quảng bá.
- [ ] **Giấy phép tài sản:** mọi hình, âm thanh, phông, ảnh tham khảo ghi trong `CREDITS`.
- [ ] **Nội dung y tế:** tuyên bố miễn trừ; không tên bệnh viện/hãng thật; không dữ liệu bệnh nhân thật; chủ đề bệnh truyền nhiễm (viêm gan, sốt rét) trình bày trung tính, không kỳ thị.

*Danh sách việc cần kiểm tra, không phải tư vấn pháp lý.*

**Chi phí:** hosting miễn phí, phông/icon giấy phép mở, âm thanh CC0 → chi phí bắt buộc có thể bằng 0. Tên miền riêng, tư vấn pháp lý, nhờ người vẽ là tuỳ chọn.

## 8. Rủi ro và cách giảm

| # | Rủi ro | Khả năng | Ảnh hưởng | Cách giảm |
|---|---|---|---|---|
| R1 | **Phạm vi quá lớn cho một người** | Rất cao | Rất cao | Lõi chung + 5 khung mini-game; phát hành theo phần; mỗi khoa là một mốc có thể dừng an toàn |
| R2 | Người mới bị ngợp kiến thức | Cao | Cao | Mỗi ngày 1–2 điều mới; người hướng dẫn riêng; chế độ Dễ; Sổ tay; chơi thử với học sinh từ M1 |
| R3 | Vòng lặp cốt lõi không vui | Trung bình | Rất cao | Thử giấy (M1), hộp xám (M2) trước khi vẽ; nguyên tắc dừng |
| R4 | Mini-game lặp lại gây chán | Trung bình | Cao | Mini-game ngắn; tự động hoá bằng thiết bị; xen kẽ nhiều loại |
| R5 | Đơn giản hoá thành sai | Trung bình | Trung bình | Mỗi luật có nguồn; ghi chú "Đơn giản hoá"; bạn sinh viên xem qua |
| R6 | Khối lượng hình ảnh lớn (kính hiển vi, tế bào, khuẩn lạc) | Cao | Cao | Phong cách phẳng kiểu sách giáo khoa; hình sinh bằng code khi có thể (hồng cầu, vi khuẩn); làm hình theo từng khoa |
| R7 | Mini-game cử chỉ (microtome, kéo lam) khó trên máy yếu/màn nhỏ | Trung bình | Trung bình | Thử sớm trên máy thật; chế độ hỗ trợ cử chỉ |
| R8 | Không có hạn chót nên kéo dài mãi | Trung bình | Cao | Mỗi mốc có bản chơi được; phát hành sớm bản 1.0 để có động lực từ người chơi |
| R9 | Mất save trên iPhone | Trung bình | Trung bình | IndexedDB + lưu bền + mã lưu + nhắc cài lên màn hình chính |
| R10 | Vướng thủ tục khi phát hành | Trung bình | Cao | Hỏi tư vấn trước M-PH |

## 9. Quyết định

| # | Câu hỏi | Trạng thái |
|---|---|---|
| D1 | Cố vấn chuyên môn | ✅ Không bắt buộc; bạn SV năm 3 ngành KTXN xem qua nếu được |
| D2 | Thời gian | ✅ Không có hạn chót; kế hoạch theo mốc |
| D3 | Kiếm tiền | ✅ Không; miễn phí 100% |
| D4 | Người chơi | ✅ Từ 13 tuổi, không cần kiến thức |
| D5 | Phạm vi chuyên môn | ✅ Tiếp nhận + 5 khoa (Hoá sinh, Huyết học – Truyền máu, Vi sinh – KST, Miễn dịch, GPB – TBH) |
| D6 | Phát hành theo phần hay một lần | Mặc định: theo phần (bản 1.0 = chương 0–2). Thien có thể đổi |
| D7 | Tên chính thức | Mở. Tạm dùng "CA TRỰC LABO" |
| D8 | Repo | Mở. Tạo trên GitHub của Thien khi bắt đầu M2 |
| D9 | Tự làm hình hay nhờ người vẽ | Mở. Mặc định tự làm phong cách phẳng |

## 10. Định nghĩa "xong" cho một tính năng

- Chạy đúng theo GDD (hoặc GDD đã cập nhật).
- Logic trong `sim/` (kể cả `score()` của mini-game) có test.
- Chơi thử trên điện thoại thật.
- Không chuỗi chữ viết cứng trong code.
- Luật chuyên môn có trong `05` và có nguồn.
- CI xanh.
