# CA TRỰC LABO — Game Design Document (GDD): hệ thống chung

> Phiên bản: 2.0 · Ngày: 2026-10-07 · Trạng thái: bản nháp chờ chơi thử
> GDD chia 2 file: **file này** (hệ thống dùng chung cho mọi khoa) và **`04a-GDD-cac-khoa.md`** (trạm, mini-game, lỗi, QC riêng của từng khoa). Dữ liệu chuyên môn ở `05-noi-dung-chuyen-mon.md`.
>
> **GDD là gì?** "Bản đặc tả sản phẩm" của game: người chơi làm gì, luật, con số, tiến trình. GDD là tài liệu sống: sửa khi thiết kế đổi, ghi ở nhật ký cuối file.
>
> **Về con số:** mọi con số là **giá trị khởi điểm để chơi thử**, nằm trong file cấu hình và chỉnh sau mỗi vòng chơi thử.

---

## Mục lục
1. Tổng quan
2. Trải nghiệm mục tiêu
3. Vòng lặp gameplay
4. Thời gian và cấu trúc một ca
5. Các hệ thống dùng chung
6. Niềm tin, chấm điểm, báo cáo giao ca
7. Sự kiện chung
8. Tiến trình: chiến dịch "Năm đầu đi làm"
9. Ngân sách khoa, thiết bị và tự động hoá
10. Sổ tay KTV
11. Ca tự do, Ca thử thách hằng ngày, chia sẻ
12. Hướng dẫn chơi
13. Độ khó và cân bằng
14. Lưu game
15. Để sau
16. Nhật ký thay đổi

---

## 1. Tổng quan

| | |
|---|---|
| Tên tạm | CA TRỰC LABO |
| Thể loại | Mô phỏng công việc, quản lý thời gian, mini-game kỹ thuật, 2D |
| Nền tảng | Web (điện thoại dọc là chính, máy tính phụ) |
| Phiên chơi | 6–8 phút/ca |
| Đối tượng | Từ 13 tuổi, không cần kiến thức y khoa |
| Độ tuổi tự phân loại | Hướng tới 12+ (chủ đề y tế, có mẫu máu/mô dạng minh hoạ, không bạo lực); xác nhận khi làm thủ tục |
| Khoa | Tiếp nhận + 5 khoa: Hoá sinh lâm sàng · Huyết học – Truyền máu · Vi sinh – Ký sinh trùng · Miễn dịch · Giải phẫu bệnh – Tế bào học |
| Kiếm tiền | Không. Miễn phí 100% |

## 2. Trải nghiệm mục tiêu

Sau một ca, người chơi nên cảm thấy:
- "Bận thật, nhưng mình sắp xếp được." (chiến thuật)
- "Hoá ra nhuộm Gram mà tẩy cồn lâu quá thì cái gì cũng hồng." (học bằng tay)
- "Phòng mổ gọi giục cắt lạnh đúng lúc máy xử lý mô báo lỗi, buồn cười ghê." (đời)
- "Mai mình sẽ thử khoa khác / làm lại ca này cho 5 sao." (muốn quay lại)

## 3. Vòng lặp gameplay

> **Vòng lặp (loop)**: chuỗi hành động lặp đi lặp lại. Vòng cốt lõi (vài giây) → vòng giữa (một ca) → vòng dài (nhiều ngày).

### 3.1. Vòng cốt lõi (3–8 giây)
```
Mẫu xuất hiện ở khay của khoa (hoặc khay Tiếp nhận)
 → chạm: thẻ mẫu (nhãn + phiếu + hình ống/lọ/đĩa)
 → kiểm tra theo luật của khoa
 → NHẬN / TỪ CHỐI (lý do) / LIÊN HỆ (với mẫu không thể lấy lại, ví dụ mô)
 → đưa tới trạm phù hợp
```

### 3.2. Vòng giữa — một ca (6–8 phút)
```
Bảng giao ca (việc tồn từ ca trước: đĩa thạch đang ủ, khối nến đã xử lý qua đêm, máy có vấn đề)
 → QC đầu ca (kiểu QC tuỳ khoa)
 → Mẫu đổ về theo đợt
 → Xử lý: trạm máy (chạy theo mẻ) + mini-game kỹ thuật (làm tay)
 → Duyệt kết quả → gửi / làm lại / gọi báo
 → Sự kiện chen ngang
 → Hết ca → Báo cáo giao ca
```

### 3.3. Vòng dài
```
Báo cáo → Ngân sách + thẻ Sổ tay
 → mua thiết bị (nhanh hơn, hoặc tự động hoá mini-game đã thành thạo)
 → ngày mới / khoa mới
 → hết chiến dịch → Ca tự do, Ca thử thách
```

## 4. Thời gian và cấu trúc một ca

- Ca ngày 07:00–15:00; ca đêm (chương 6) 19:00–07:00 rút gọn. Ca chạy khoảng **6–8 phút thực** ở tốc độ thường (tỉ lệ trong cấu hình).
- Ngày đầu mỗi chương là ca ngắn để học.
- Đồng hồ chạy khi xem thẻ mẫu và khi làm mini-game (giữ áp lực). Màn quyết định lớn (biểu đồ QC, sự kiện) **dừng giờ**.
- Tạm dừng luôn có; khi dừng, khu làm việc bị che.
- Tốc độ ×2 mở sau ngày đầu của mỗi chương.

**Phòng (room):** mỗi khoa là một phòng có các **trạm** (máy, bàn làm tay, tủ). Trong chương 0–5, người chơi ở 1 phòng chính (+ khay Tiếp nhận). Trong chương 6, chuyển qua lại giữa các phòng bằng thanh chọn phòng; phòng nào có việc gấp thì nhấp nháy.

## 5. Các hệ thống dùng chung

### 5.1. Mẫu, phiếu, bệnh nhân
- Mỗi **mẫu** (ống máu, lọ nước tiểu, lọ phân, que tăm bông, chai cấy máu, lọ mô, lam tế bào...) thuộc một **phiếu chỉ định** của một **bệnh nhân hư cấu**.
- Phiếu có: họ tên, năm sinh, mã bệnh nhân, khoa gửi, mức ưu tiên (Thường / 🚑 Cấp cứu / 🔪 Phòng mổ), danh sách xét nghiệm, loại mẫu yêu cầu.
- Nhãn mẫu có: họ tên, năm sinh, mã bệnh nhân, giờ lấy mẫu (+ vị trí lấy với mẫu mô và vi sinh).
- Ở mức **Dễ**, phiếu hiện biểu tượng loại mẫu/màu ống cần dùng. Ở mức Thường/Khó, người chơi phải biết (đã học ở chương trước hoặc tra Sổ tay).

### 5.2. Tiếp nhận mẫu (chương 0, và là trạm chung ở chương 6)
Kiểm tra chung cho mọi khoa:

| Kiểm tra | Lỗi | Xử lý đúng |
|---|---|---|
| Định danh | Nhãn không khớp phiếu (≥2 thông tin), không nhãn | Từ chối (trừ mẫu không lấy lại được → Liên hệ) |
| Loại mẫu | Sai loại ống/lọ | Từ chối |
| Số lượng | Thiếu thể tích | Từ chối (trừ mẫu không lấy lại được → Liên hệ) |
| Thời gian | Để quá giờ quy định | Từ chối |
| Bảo quản | Sai nhiệt độ vận chuyển, lọ rò rỉ | Từ chối; rò rỉ → xử lý an toàn sinh học |

**Chuyển mẫu (routing)** tới đúng khoa theo loại mẫu + xét nghiệm. Bảng chuyển mẫu ở `05` mục 1.

**Luật đặc biệt: mẫu không lấy lại được** (mô sinh thiết, dịch não tuỷ, mẫu phẫu thuật): **không bao giờ vứt**. Lỗi → chọn **Liên hệ** (gọi khoa gửi bổ sung thông tin) và giữ mẫu lại. Từ chối mẫu này là lỗi nghiêm trọng.

### 5.3. Trạm máy (dùng chung khung)
- Mỗi máy có: loại mẫu nhận, sức chứa, thời gian chạy, trạng thái QC, sự cố có thể gặp.
- Nạp mẫu → máy chạy theo mẻ hoặc hàng chờ → kết quả về màn Kết quả.
- Nút 🚑 Ưu tiên kéo mẫu cấp cứu lên đầu.
- Máy chỉ chạy mẫu bệnh nhân khi QC trong ngày được đánh dấu Đạt.

### 5.4. Mini-game kỹ thuật (dùng chung khung)
- Mỗi mini-game dài **10–30 giây**, một màn hình, thao tác chạm/vuốt đơn giản.
- Cho điểm **Tay nghề** 0–100 (độ chính xác, thời gian).
- Kết quả mini-game ảnh hưởng chất lượng mẫu: ví dụ nhuộm Gram sai → vi khuẩn sai màu → nếu người chơi không nhận ra và báo sai thì bị tính "kết quả sai".
- Lần đầu gặp có hướng dẫn 1–2 câu. Mức Dễ có gợi ý bước tiếp theo.
- Khi đã làm tay đủ tốt (ví dụ 10 lần, Tay nghề trung bình ≥70), mở khoá thiết bị **tự động hoá** mini-game đó (mục 9).
- Danh sách mini-game từng khoa ở `04a`.

### 5.5. QC (kiểm tra chất lượng)
Mỗi khoa có kiểu QC riêng nhưng cùng một ý: **trước khi tin kết quả bệnh nhân, kiểm tra xem máy/hoá chất/quy trình có cho kết quả đúng với mẫu đã biết trước không.**

| Khoa | Kiểu QC | Biểu hiện trong game |
|---|---|---|
| Hoá sinh, Miễn dịch (máy tự động) | Control 2 mức, biểu đồ Levey-Jennings, luật Westgard | Đọc biểu đồ, chọn Đạt/Không đạt, chọn cách khắc phục |
| Huyết học | Máu chứng 3 mức | Giống trên, biểu đồ đơn giản hơn |
| Truyền máu | Kiểm tra huyết thanh mẫu với hồng cầu đã biết nhóm | Anti-A phải ngưng kết với hồng cầu A; không ngưng kết với hồng cầu B |
| Vi sinh | Chủng chuẩn | Đĩa kháng sinh đồ chứng phải có vòng vô khuẩn trong khoảng cho phép |
| Miễn dịch (thủ công) | Chứng âm, chứng dương trong mỗi lần làm ELISA/test nhanh | Chứng không đạt → cả lượt làm không hợp lệ |
| Giải phẫu bệnh | Lam chứng nhuộm | Nhân xanh tím, bào tương hồng → đạt |

**Hậu quả trễ:** bỏ qua QC hỏng → kết quả sai lệch trong một khoảng thời gian; lộ ra sau qua cuộc gọi của bác sĩ hoặc kết quả bất thường hàng loạt; phải làm lại các mẫu bị ảnh hưởng.

### 5.6. Màn Kết quả (LIS)
- Kết quả theo phiếu; cờ: **H/L** (cao/thấp), **‼️** (giá trị nguy hiểm), **Δ** (khác nhiều so với lần trước), cờ riêng của khoa (ví dụ HIL ở hoá sinh, "cần xem lam" ở huyết học).
- Hành động: **Duyệt và gửi**, **Làm lại**, **Gọi báo** (‼️, phải gọi trong 15 phút game), **Huỷ và yêu cầu mẫu mới**, **Gửi xét nghiệm khẳng định** (miễn dịch), **Chuyển bác sĩ đọc** (giải phẫu bệnh, tế bào học).
- Nguyên tắc xuyên suốt: **KTV không chẩn đoán.** Kết quả cần kết luận chuyên môn (lam tế bào bất thường, tiêu bản mô) luôn chuyển bác sĩ.
- Duyệt nhanh: "Gửi tất cả phiếu không có cờ" (mở sau ngày 2 của mỗi chương).

### 5.7. An toàn sinh học
- Mẫu vi sinh, mẫu nghi nhiễm, lọ formalin: phải thực hiện bước an toàn trước khi thao tác (mở tủ an toàn sinh học, bật tủ hút). Quên → trừ điểm An toàn, có thể kích hoạt sự kiện "phơi nhiễm" (mất thời gian xử lý).
- Đổ vỡ mẫu → quy trình dọn: rắc chất khử khuẩn → chờ → lau → bỏ vào thùng rác y tế (mini-game ngắn).

### 5.8. Điện thoại
- Khoa lâm sàng, cấp cứu, phòng mổ gọi đến; 2–3 câu trả lời có sẵn. Bỏ lỡ 3 lần → trừ Niềm tin.
- Người chơi gọi đi để báo ‼️, gọi kỹ sư, liên hệ khoa gửi.

## 6. Niềm tin, chấm điểm, báo cáo giao ca

### 6.1. Niềm tin (0–100)
Về 0 → ca kết thúc sớm ("Trưởng khoa: Em nghỉ ngơi đi, mai làm lại"). Mức Dễ: không xuống dưới 30.

| Sự kiện | Thay đổi |
|---|---|
| Phát túi máu không hoà hợp / sai nhóm | −40 |
| Trả kết quả của mẫu nhầm bệnh nhân | −30 |
| Từ chối hoặc làm mất mẫu không lấy lại được (mô, dịch não tuỷ) | −30 |
| Trả kết quả của mẫu lẽ ra phải từ chối | −15 |
| Trả kết quả khi QC hỏng (mỗi phiếu) | −5 (tối đa −30 mỗi lần) |
| Không gọi báo ‼️ trong 15 phút | −15 |
| Báo "dương tính/có bệnh" thay vì "phản ứng, chuyển khẳng định"; KTV tự kết luận chẩn đoán | −10 |
| Bỏ bước an toàn sinh học | −5 |
| Mẫu cấp cứu / phòng mổ trễ hẹn | −5 |
| Mẫu thường trễ hẹn | −1 |
| Từ chối nhầm mẫu tốt | −3 |
| Trả mẫu cấp cứu đúng hẹn | +2 |
| Phát hiện và xử lý đúng QC hỏng | +5 |

### 6.2. Hẹn trả kết quả (TAT)
Theo loại xét nghiệm (bảng trong `05`): ví dụ hoá sinh cấp cứu 60 phút; phát máu cấp cứu 30 phút; cắt lạnh 20 phút; cấy vi khuẩn tính theo ngày (không trừ điểm trong ca, chấm ở báo cáo).

### 6.3. Báo cáo giao ca
| Tiêu chí | Cách tính |
|---|---|
| 🔍 **Chính xác** | % quyết định nhận/từ chối/liên hệ đúng + % kết quả gửi đi đúng |
| ⏱️ **Đúng hẹn** | % phiếu trả trong hạn (cấp cứu, phòng mổ ×2) |
| 🛡️ **An toàn người bệnh** | 100 trừ các lỗi nghiêm trọng (phát máu sai, trả kết quả sai, không báo ‼️, mất mẫu mô, bỏ bước an toàn) |
| ✋ **Tay nghề** | Trung bình điểm mini-game + điểm QC |

Tổng = 0,3 × Chính xác + 0,2 × Đúng hẹn + 0,35 × An toàn + 0,15 × Tay nghề.
Sao: ≥90 ⭐⭐⭐⭐⭐ · ≥75 ⭐⭐⭐⭐ · ≥60 ⭐⭐⭐ · ≥40 ⭐⭐ · còn lại ⭐. Kết thúc sớm: tối đa ⭐.

**"Chuyện hôm nay":** 3–5 lỗi đáng nhớ nhất, mỗi lỗi một câu giải thích + nút mở thẻ Sổ tay.

## 7. Sự kiện chung

| # | Sự kiện | Ghi chú |
|---|---|---|
| E1 | 🚑 Cấp cứu dồn mẫu | Mọi khoa |
| E2 | 📞 Bác sĩ gọi hỏi kết quả | Mọi khoa |
| E3 | ⚙️ Máy lỗi (tắc kim, báo lỗi, hết hoá chất) | Khoa có máy |
| E4 | 🏷️ Mẫu không nhãn / nhãn viết tay khó đọc | Mọi khoa |
| E5 | 💥 Rơi vỡ mẫu | Mini-game dọn an toàn |
| E6 | 🐢 Máy tính (LIS) chậm | |
| E7 | 🍱 Trực trưa một mình | |
| E8 | 👔 Trưởng khoa đi kiểm tra | Thưởng nếu không tồn mẫu quá 30 phút |
| E9 | ⚡ Mất điện ngắn | Máy dừng; tủ ấm, tủ máu phải kiểm tra nhiệt độ |
| E10 | 🎓 Sinh viên thực tập hỏi bài | Trả lời đúng câu hỏi nhanh (2 lựa chọn) → thưởng Niềm tin; dạy lại kiến thức đã học |

Sự kiện riêng của từng khoa ở `04a`.

## 8. Tiến trình: chiến dịch "Năm đầu đi làm"

| Chương | Khoa | Ngày | Người hướng dẫn | Mở dần (tóm tắt, chi tiết ở `04a`) |
|---|---|---|---|---|
| 0 | Tiếp nhận | 3 | Chị Hạnh | Định danh → loại mẫu → chuyển 5 khoa → mẫu không lấy lại được |
| 1 | Hoá sinh lâm sàng | 5 | Chị Hạnh | Ly tâm → tan huyết/đục/vàng → QC Westgard → giá trị nguy hiểm, pha loãng → nước tiểu |
| 2 | Huyết học – Truyền máu | 6 | Anh Minh | Máy đếm → lam máu → đông máu → nhóm máu → phản ứng chéo → phát máu cấp cứu |
| 3 | Vi sinh – Ký sinh trùng | 6 | Chị Lan | Cấy ria → đọc đĩa → Gram → catalase, định danh → kháng sinh đồ → soi phân, sốt rét |
| 4 | Miễn dịch | 5 | Anh Khoa | Test nhanh → máy miễn dịch → ELISA → sàng lọc và khẳng định |
| 5 | Giải phẫu bệnh – Tế bào học | 5 | Cô Thu | Nhận lọ mô → đúc nến → cắt microtome → H&E → tế bào học → cắt lạnh |
| 6 | Ca trực đêm tổng hợp | 5 | (một mình) | Tất cả các khoa cùng lúc, chuyển phòng |

- Mỗi chương: ngày đầu ngắn, mỗi ngày mở 1–2 điều mới, ngày cuối là "ngày bận nhất".
- Qua ngày không cần sao tối thiểu. Chơi lại ngày bất kỳ.
- **Đánh giá luân khoa** cuối mỗi chương (theo tổng sao chương): mở huy hiệu khoa.
- **Kết thúc chiến dịch** sau chương 6: đánh giá năm đầu (vui vẻ ở mọi mức).
- Thứ tự chương 1→6 cố định trong lần chơi đầu; sau khi hết chương 2, có thể chơi Ca tự do ở các khoa đã mở.

## 9. Ngân sách khoa, thiết bị và tự động hoá

- Cuối ca: Ngân sách = 50 + 30 × số sao. Đơn vị "điểm", không mua bằng tiền thật.
- Thiết bị mua một lần, dùng trong chiến dịch và Ca tự do; **không áp dụng trong Ca thử thách**.
- Hai loại:
  - **Nâng cấp tốc độ/sức chứa:** máy ly tâm lớn, máy hoá sinh nhanh, tủ ấm lớn...
  - **Tự động hoá:** thay một mini-game bằng máy (mở khi đã thành thạo, xem 5.4). Máy tự động tốn thời gian chạy nhưng giải phóng tay người chơi. Người chơi vẫn có thể chọn làm tay để lấy điểm Tay nghề.
- Danh sách thiết bị theo khoa ở `04a`. Thiết bị chung: Đầu đọc mã vạch (tô sáng chỗ nhãn khác phiếu), Hợp đồng bảo trì (kỹ sư tới nhanh gấp đôi), Máy pha cà phê (+10 Niềm tin đầu ca), Trang trí phòng.

## 10. Sổ tay KTV
- ~80 thẻ chia theo khoa (danh sách ở `05` cuối mỗi phần khoa). Mở khi gặp lần đầu hoặc làm sai.
- Mỗi thẻ: tiêu đề, 2–4 câu dễ hiểu, hình minh hoạ, phần "Biết thêm" (chi tiết hơn), nguồn.
- % sưu tập theo khoa và tổng.

## 11. Ca tự do, Ca thử thách hằng ngày, chia sẻ

- **Ca tự do:** chọn khoa đã mở hoặc "trực tổng hợp"; thông số ngẫu nhiên, khó dần.
- **Ca thử thách hằng ngày:** một ca giống nhau cho mọi người (khoa xoay vòng theo ngày trong tuần, Chủ nhật là trực tổng hợp), mức Thường, không thiết bị. Chỉ lần đầu tính điểm.
- **Thẻ chia sẻ:**
```
🧪 CA TRỰC LABO · 07/10/2026 · 🦠 Vi sinh
⭐⭐⭐⭐ 82/100
🧫 24 mẫu · ❌ 2 lỗi · 🔬 Gram chuẩn 9/10
🚑 cấp cứu 5/5 đúng giờ
(đường link game)
```
- Không có bảng xếp hạng trực tuyến trong các bản đầu.

## 12. Hướng dẫn chơi
- Người chơi làm việc ngay trong 30 giây đầu.
- Mỗi chương có người hướng dẫn riêng; mỗi lời hướng dẫn ≤ 2 câu, có mũi tên chỉ chỗ.
- Mỗi ngày mở điều mới bằng một tình huống được sắp đặt sẵn (ví dụ ngày đầu Truyền máu: mẫu đầu tiên là nhóm O dễ đọc).
- Nút "?" ở mọi màn hình mở thẻ Sổ tay liên quan.

## 13. Độ khó và cân bằng

### 13.1. Ba mức độ khó
| | Dễ | Thường | Khó |
|---|---|---|---|
| Tốc độ đồng hồ | 0,6× | 1× | 1,2× |
| Gợi ý loại mẫu/bước tiếp theo | Có | Không | Không |
| Niềm tin tối thiểu | 30 | 0 | 0 |
| Lỗi tinh vi (sai 1 chữ số, vạch T rất mờ, khuẩn lạc lẫn) | Ít | Vừa | Nhiều |
| Luật nâng cao (Westgard 4-1s/10x, kháng nguyên yếu D, ký sinh trùng mật độ thấp) | Không | Một phần | Có |

### 13.2. Núm vặn (trong cấu hình theo ngày)
Số mẫu và nhịp đổ về · tỷ lệ mẫu lỗi · độ khó thấy của lỗi · tỷ lệ cấp cứu · số sự kiện · thời gian máy · độ khó mini-game (dung sai thời gian, kích thước vùng chạm).

**Mục tiêu cân bằng** (đo khi chơi thử): học sinh 13–15 tuổi chưa biết gì đạt ≥3 sao ngày đầu mỗi chương ở mức Thường; người chơi lần đầu đạt trung bình 2–3 sao ở ngày cuối mỗi chương; người chơi quen đạt 4–5 sao.

## 14. Lưu game
- Tự động lưu khi kết thúc ca và khi mua thiết bị. Thoát giữa ca = chơi lại ca đó.
- Việc tồn sang ngày sau (đĩa đang ủ, khối nến đang xử lý) **do cấu hình ngày quy định sẵn**, không phụ thuộc ca trước của người chơi; nhờ vậy chơi lại một ngày luôn giống nhau.
- Xuất/nhập mã lưu để chuyển máy. Chi tiết: `07-TDD.md`.

## 15. Để sau
Khu Sinh học phân tử (tách chiết DNA, PCR, điện di); chế độ Trưởng labo (quản lý nhân sự, kho); bảng xếp hạng; đồng bộ tài khoản; tiếng Anh; nhân vật tuỳ biến.

## 16. Nhật ký thay đổi
| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-10-06 | 1.0 | Bản đầu tiên |
| 2026-10-06 | 1.1 | Đơn giản hoá cho mọi lứa tuổi (từ 8 tuổi), 2 khu, 4 ống |
| 2026-10-07 | 2.0 | Theo yêu cầu của Thien: từ 13 tuổi; 5 khoa + Tiếp nhận; chiến dịch 7 chương; mini-game kỹ thuật và thiết bị tự động hoá; QC theo từng khoa; 3 mức độ khó; tách chi tiết từng khoa sang `04a` |
