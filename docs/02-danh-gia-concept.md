# Đánh giá concept gốc "CA TRỰC LABO"

> Phiên bản: 1.2 · Ngày: 2026-10-07 · Đánh giá cho: `01-concept-goc.md`
> **v1.1:** thêm mục 4 — câu trả lời của Thien. **v1.2:** thêm mục 5 — mở rộng lên 13+ và 5 chuyên ngành. Mục 1–3 là đánh giá ban đầu; các điều chỉnh sau đó nằm ở mục 4–5.
> Kết quả của bản đánh giá này được áp dụng vào `03-concept-v2.md`.

## Tóm tắt một dòng

Ý tưởng **đáng làm** và nền tảng đúng hướng (mô phỏng một ca làm, không phải quiz; MVP nhỏ; web mobile-first). Nhưng concept gốc mới là **bài phân tích vì sao nên làm**, chưa phải **thiết kế game**: còn thiếu luật chơi cụ thể, điều kiện thắng/thua, nhịp độ trên điện thoại, đối tượng người chơi, và có vài chỗ tự mâu thuẫn. Bản v2 giữ toàn bộ tinh thần, sửa các điểm dưới đây.

---

## 1. Những điểm mạnh nên giữ nguyên

| # | Điểm mạnh | Vì sao quan trọng |
|---|---|---|
| S1 | Định vị "mô phỏng một ngày làm KTV", không phải "game học xét nghiệm" | Đúng với thể loại job-sim đang được chia sẻ; người ngoài ngành cũng thấy vui. |
| S2 | Quy trình 3 giai đoạn (trước – trong – sau xét nghiệm) làm khung gameplay | Có sẵn cấu trúc, không phải bịa luật chơi từ số 0. |
| S3 | QC là điểm khác biệt | Không game bán hàng nào có "máy chạy đúng nhưng kết quả sai". Đây là "khoảnh khắc ồ" của game. |
| S4 | Random events kiểu "Ủa tưởng chill lắm?" | Tạo cảm giác hài hước, đời, dễ thành meme. |
| S5 | MVP chỉ Huyết học + Sinh hóa | Phạm vi đủ nhỏ để một người làm được. |
| S6 | Web, không login, không cài, chơi ngay, có ảnh kết quả để share | Đúng cách các game cùng trend lan truyền (Tiệm Trà Nhỏ: không login, lưu trên trình duyệt, có ảnh tổng kết ngày để lưu/chia sẻ). |
| S7 | Không tự bịa dữ liệu y khoa; có chuyên gia kiểm duyệt | Rất quan trọng với chủ đề y tế. |

---

## 2. Những điểm yếu và cách sửa

Mức độ: 🔴 phải sửa trước khi làm · 🟠 nên sửa trong giai đoạn thiết kế · 🟡 có thể để sau.

### 🔴 W1. Chưa có điều kiện thắng/thua và mục tiêu của một ca
Concept nói "xem bạn sống được bao lâu" nhưng không định nghĩa "chết" là gì. Không có mục tiêu thì người chơi không biết mình đang làm tốt hay dở.

**Sửa:** Mỗi ca có thanh **Uy tín Labo trong ca** (gọi tắt "Niềm tin"). Sai sót nghiêm trọng (trả kết quả sai, nhầm bệnh nhân, bỏ qua QC hỏng) trừ mạnh; trễ mẫu cấp cứu trừ vừa. Niềm tin về 0 → ca kết thúc sớm ("Trưởng khoa mời lên nói chuyện"). Hết giờ ca → báo cáo giao ca chấm 1–5 sao. Xem GDD mục 6.

### 🔴 W2. Mỗi mẫu có quá nhiều bước, mâu thuẫn với "80 mẫu cùng lúc"
Core loop gốc có 9 bước cho **mỗi mẫu**, cộng mini-game ly tâm "kéo tube – chọn chế độ – start – chờ – lấy ra". Nếu mỗi mẫu tốn 30–60 giây thao tác thì 80 mẫu là 1 tiếng, không thể chơi trên điện thoại.

**Sửa:** Tách hai tầng thao tác:
- **Thao tác theo từng mẫu** (nhanh, 3–8 giây): xem mẫu → Nhận/Từ chối → xếp vào đúng chỗ.
- **Thao tác theo mẻ** (batch): ly tâm cả rack, chạy máy cả khay, duyệt kết quả cả danh sách. Mini-game chỉ xuất hiện khi có lý do (cân bằng máy ly tâm, đọc biểu đồ QC), không lặp lại cho từng ống.
- Số mẫu tối đa thực tế cho một ca ~8–10 phút trên điện thoại là **40–60 mẫu**, không phải 80–100. "Rush hour" là đợt dồn 10–15 mẫu trong 1–2 phút.

### 🔴 W3. Hai game khác nhau đang trộn vào nhau
"Technician Simulator" (quản lý thời gian, phản xạ) và "Laboratory Management Simulator" (mua máy, doanh thu) là hai thể loại khác nhau, cần hai bộ UI và cân bằng khác nhau. Làm cả hai trong MVP sẽ không xong cái nào.

**Sửa:** MVP chỉ là **Technician Simulator**. Phần quản lý chỉ giữ ở mức nhẹ: cuối ngày nhận **Ngân sách khoa** để mua vài nâng cấp (máy ly tâm lớn hơn, máy đọc mã vạch...). Chế độ "Trưởng labo" để sau MVP.

### 🔴 W4. Chưa xác định người chơi là ai
Người ngoài ngành cần hướng dẫn nhiều, chịu ít chi tiết. Sinh viên/KTV xét nghiệm muốn chi tiết đúng, sẽ bắt lỗi chuyên môn và cũng là nhóm chia sẻ mạnh nhất (meme nghề). Hai nhóm kéo thiết kế về hai hướng.

**Sửa:** Người chơi chính là **sinh viên ngành y/xét nghiệm và nhân viên y tế trẻ (18–30 tuổi)**; người chơi phụ là người ngoài ngành tò mò. Nguyên tắc: *chơi được mà không cần kiến thức, nhưng có kiến thức thì chơi giỏi hơn*. Mọi luật chuyên môn đều được game dạy trong lúc chơi (Sổ tay KTV, hướng dẫn ngày đầu).

### 🟠 W5. Cơ chế QC đang là câu hỏi trắc nghiệm A/B/C/D
"Có tiếp tục chạy mẫu không? A. Chạy luôn B. Kiểm tra QC..." là quiz, trái với chính nguyên tắc của concept. Ngoài ra QC trên thực tế chạy **đầu ca/mỗi lô**, không phải "sau vài ngày mới thấy".

**Sửa:** QC là một **hành động có giá**: đầu ca phải chạy QC (mất thời gian trong ca), xem biểu đồ Levey-Jennings, tự quyết định máy "đạt" hay "không đạt". Nếu chọn bỏ qua mà QC thực sự hỏng, game không báo ngay; hậu quả hiện ra sau (kết quả bất thường hàng loạt, bác sĩ gọi phản ánh, phải chạy lại toàn bộ mẫu từ lần QC đạt gần nhất). Khắc phục là chuỗi hành động thật: chạy lại control, thay hóa chất, hiệu chuẩn, gọi kỹ sư, mỗi cái tốn thời gian khác nhau. Áp dụng một phần luật Westgard (1-2s cảnh báo; 1-3s, 2-2s, R-4s loại). Xem GDD mục 5.6.

### 🟠 W6. Ví dụ "học mà không thấy đang học" quá chung chung
Câu giải thích mẫu: *"Một số tình trạng của mẫu có thể ảnh hưởng đến kết quả..."* không dạy được gì. Người chơi sẽ chỉ nhớ "chỗ này phải bấm Reject".

**Sửa:** Mỗi phản hồi sai phải **cụ thể, một câu, có nguyên nhân – hệ quả**: *"Mẫu tan huyết: hồng cầu vỡ làm Kali tăng giả. Chỉ định có Điện giải đồ nên phải từ chối và yêu cầu lấy lại."* Đồng thời dạy rằng **quyết định phụ thuộc xét nghiệm được chỉ định** (cùng một ống tan huyết nhẹ, có thể nhận cho xét nghiệm này nhưng phải từ chối cho xét nghiệm khác). Đây chính là độ sâu khiến game không thành quiz.

### 🟠 W7. "Sample routing" dễ thành nhàm
CBC → Huyết học, Glucose → Sinh hóa là luật một-một; học xong 2 phút là hết thú vị.

**Sửa:** Độ khó của routing đến từ chỗ khác: (1) một bệnh nhân có nhiều ống, mỗi ống đi một nơi; (2) loại ống quyết định nơi đến chứ không phải tên bệnh nhân (ví dụ HbA1c dùng ống EDTA nhưng chạy bên Sinh hóa); (3) Sinh hóa phải ly tâm trước, Huyết học thì không; (4) ưu tiên mẫu cấp cứu; (5) máy có công suất giới hạn và có thể hỏng. Routing trở thành bài toán **xếp hàng ưu tiên**, không phải bài toán phân loại.

### 🟠 W8. Tiền "Revenue $1,240" không hợp bối cảnh
KTV ở bệnh viện không nhận tiền theo mẫu; ký hiệu đô la cũng lạ với người chơi Việt. Nó kéo game về phía "kinh doanh", trái với fantasy "sống sót qua ca trực".

**Sửa:** Đổi thành **Ngân sách khoa** (điểm, không phải tiền thật) do trưởng khoa duyệt dựa trên kết quả ca, dùng để nâng cấp. Tiền chỉ là phương tiện nâng cấp, không phải mục tiêu.

### 🟠 W9. Bài toán "mỗi labo một SOP khác nhau" chưa có lời giải
Concept nhận ra loại ống, thời gian, giá trị tham chiếu khác nhau giữa các nơi, nhưng không nói game sẽ dùng chuẩn nào. Nếu không chốt, mọi người chơi trong ngành đều có thể nói "chỗ tôi không làm vậy".

**Sửa:** Game có bệnh viện hư cấu **"Bệnh viện Đa khoa Labo Xanh"** với **Sổ tay SOP nội bộ** hiển thị trong game. Mọi luật đúng/sai là "đúng theo SOP của bệnh viện này", dựa trên chuẩn quốc tế (CLSI, WHO) và thực hành phổ biến ở Việt Nam, có chuyên gia duyệt. Thông báo rõ: game là mô phỏng giáo dục – giải trí, không thay thế quy trình của cơ sở thật.

### 🟠 W10. Phụ thuộc vào trend tháng 9/2026
Trend "game mô phỏng nghề" trên Threads/TikTok lên rất nhanh và cũng tắt rất nhanh. Khi game ra mắt (sớm nhất vài tháng nữa), trend có thể đã qua.

**Sửa:** Dùng trend làm **bằng chứng có nhu cầu**, không làm nền móng. Game phải tự có lý do để người ta quay lại và chia sẻ: chế độ **Ca thử thách hằng ngày** (mọi người cùng chơi một ca giống nhau, so điểm, giống cách Wordle lan truyền), và cộng đồng ngành xét nghiệm (nhóm sinh viên, hội KTV) là kênh phát hành chính.

### 🟠 W11. Thiếu hẳn nhiều phần mà một tài liệu thiết kế game cần có
Không có: nhịp độ ca chơi và độ dài phiên, đường cong độ khó, hướng dẫn chơi lần đầu (onboarding), phong cách hình ảnh/âm thanh, giao diện trên màn hình dọc, khả năng tiếp cận (mù màu, vì **màu nắp ống là thông tin cốt lõi**), cách đo "retention", pháp lý, kế hoạch làm. Các phần này được bổ sung trong `04-GDD.md`, `06-UI-UX-va-mi-thuat.md`, `07-TDD.md`, `08-ke-hoach-du-an.md`.

### 🟡 W12. Đề xuất Next.js là thừa cho game này
Game chạy hoàn toàn trên trình duyệt, không cần máy chủ render trang. Next.js thêm độ phức tạp mà không dùng tới.

**Sửa:** Vite + React + TypeScript, phần mô phỏng viết bằng TypeScript thuần tách khỏi giao diện. Lý do và so sánh với Phaser có trong `07-TDD.md`.

### 🟡 W13. LocalStorage không đủ an toàn để lưu tiến trình
Safari trên iPhone có thể xoá dữ liệu lưu của trang web nếu người dùng không ghé lại một thời gian. Với game nhiều ngày chơi, mất save là lý do bỏ game số một.

**Sửa:** Lưu bằng IndexedDB, xin quyền lưu trữ bền (persistent storage), khuyến khích "Thêm vào màn hình chính", và có nút **xuất/nhập mã lưu** (một chuỗi để dán lại). Đồng bộ đám mây bằng tài khoản để sau MVP.

### 🟡 W14. Pháp lý và an toàn nội dung chưa được nhắc
- Việt Nam quản lý game trên mạng theo **Nghị định 147/2024/NĐ-CP** (phân loại G1–G4, tự phân loại độ tuổi 00+/12+/16+/18+). Cần kiểm tra với luật sư/đơn vị tư vấn trước khi phát hành công khai, kể cả game miễn phí.
- Nội dung y tế: không dùng tên/thương hiệu bệnh viện, hãng máy thật; không dùng dữ liệu bệnh nhân thật; có tuyên bố miễn trừ.
- Tên game: kiểm tra trùng nhãn hiệu trước khi mua tên miền.

### 🟡 W15. Phần "Chuyên gia kiểm duyệt" mới là giả định
Concept viết "nếu team có người học KTXN". Đây là **phụ thuộc quan trọng nhất** của dự án: thiếu người duyệt thì không nên phát hành nội dung chuyên môn.

**Sửa:** Kế hoạch có bước tìm ít nhất 1 KTV/giảng viên xét nghiệm làm cố vấn ngay từ giai đoạn 1, kèm quy trình duyệt nội dung (xem `05-noi-dung-chuyen-mon.md` mục 8).

---

## 3. Những thay đổi chính trong v2 (so sánh nhanh)

| Hạng mục | Concept gốc | Concept v2 |
|---|---|---|
| Thể loại | Technician sim + Lab management | Technician sim (quản lý thời gian), quản lý nhẹ ở lớp nâng cấp |
| Mục tiêu ca | Chưa có | Sống sót tới hết ca, giữ Niềm tin > 0, đạt sao |
| Thao tác | Mini-game cho từng mẫu | Từng mẫu nhanh + xử lý theo mẻ |
| Số mẫu | 5 → 100, rush 80 | 6 (ngày 1) → 45 (ngày 10); cấp cứu dồn 4–6 ống |
| QC | Câu hỏi A/B/C/D | "Kiểm tra máy" có tốn thời gian, biểu đồ 3 vùng màu, 3 cách sửa, hậu quả trễ |
| Kiến thức | Giải thích chung chung | Một câu cụ thể, dễ hiểu cho trẻ em, Sổ tay KTV |
| Tiền | Revenue $ | Ngân sách khoa (điểm) |
| Chuẩn đúng/sai | Không chốt | "Quy định của Labo Xanh" (hư cấu), đơn giản hoá từ CLSI/WHO; bạn SV ngành xét nghiệm xem qua, không bắt buộc |
| Viral | Share điểm | Ca thử thách hằng ngày cùng đề + thẻ kết quả để share |
| Người chơi | Không nói | Mọi người, kể cả trẻ em; người trong ngành là nhóm chia sẻ đầu tiên |
| Công nghệ | Next.js + LocalStorage | Vite + React + TS, mô phỏng TS thuần, IndexedDB + mã lưu |
| Pháp lý | Không nhắc | NĐ 147/2024, miễn trừ y khoa, nhãn hiệu |

## 4. Câu trả lời của Thien (2026-10-06) và điều chỉnh

| Câu hỏi | Trả lời | Ảnh hưởng tới thiết kế |
|---|---|---|
| Cố vấn chuyên môn? | Có một bạn SV năm 3 ngành KTXN; không cần đúng chuyên môn tuyệt đối vì là game giải trí | Bỏ khâu "chuyên gia duyệt bắt buộc" (W9, W15 nhẹ đi). Luật lấy từ chuẩn thế giới rồi đơn giản hoá; bạn SV xem qua nếu được |
| Người chơi? | Người không có kiến thức, kể cả trẻ em, phải chơi dễ dàng | **W4 đổi hướng:** người chơi chính là mọi người từ ~8 tuổi. Luật phải nhìn thấy được (chấm màu ống trên phiếu, biểu tượng lý do bỏ, biểu đồ QC 3 vùng màu); thêm chế độ thong thả; chi tiết chuyên môn chuyển sang chế độ "Dân trong nghề" sau MVP |
| Thời gian? | Không có hạn chót | Kế hoạch chia theo mốc, không theo tuần |
| Kiếm tiền? | Không, miễn phí 100% | Không quảng cáo, không mua trong game, không thu dữ liệu cá nhân |

Tên chính thức vẫn đang mở, tạm dùng "CA TRỰC LABO".

## 5. Điều chỉnh lần 2 (2026-10-07): tăng độ sâu, 13+, 5 chuyên ngành

Thien thấy bản v2.1 quá đơn giản và yêu cầu:

| Yêu cầu | Thay đổi trong thiết kế |
|---|---|
| Độ tuổi từ 13 trở lên (thay vì 8) | Dùng thuật ngữ thật kèm giải thích; khôi phục luật chi tiết (tan huyết theo từng xét nghiệm, mẫu đục/vàng, ống citrate, HbA1c, luật Westgard đầy đủ); 3 mức độ khó thay cho chế độ thong thả |
| Thêm Hoá sinh lâm sàng, Huyết học – Truyền máu, Vi sinh – Ký sinh trùng, Miễn dịch, Giải phẫu bệnh – Tế bào học | Chiến dịch "Năm đầu đi làm": 7 chương (Tiếp nhận + 5 khoa + Ca trực đêm tổng hợp), 35 ngày; mỗi khoa có trạm, luật, QC và mini-game riêng (`04a-GDD-cac-khoa.md`) |
| Đơn giản, dễ chơi, dễ tìm hiểu | 27 mini-game ngắn dựng trên 5 khung thao tác; mở dần 1–2 điều mới mỗi ngày; người hướng dẫn riêng mỗi khoa; Sổ tay ~80 thẻ; thiết bị tự động hoá mini-game đã thành thạo |
| Kiến thức theo giáo trình, tài liệu quốc tế, không cần quá chính xác | Nội dung dựa trên WHO, CDC, CLSI, EUCAST, giáo trình; ghi chú "Đơn giản hoá" ở chỗ đã lược bớt (`05-noi-dung-chuyen-mon.md`) |

**Đánh giá rủi ro mới:** phạm vi tăng khoảng 4–5 lần. Cách giảm: lõi chung + khung mini-game dùng lại, và **phát hành theo phần** (bản 1.0 = Tiếp nhận + Hoá sinh + Huyết học – Truyền máu). Xem `08-ke-hoach-du-an.md`.

**Nguyên tắc vẫn giữ:** không chẩn đoán (KTV làm xét nghiệm, bác sĩ kết luận), không quiz, không hình ảnh ghê sợ, miễn phí 100%.
