# Giao diện, trải nghiệm, hình ảnh và âm thanh

> Phiên bản: 2.0 · Ngày: 2026-10-07 · v2.0: người chơi từ 13 tuổi, 5 khoa, phòng và mini-game
> Gộp 3 tài liệu mà dự án lớn thường tách riêng: **UI/UX spec** (màn hình, thao tác), **Art bible** (phong cách hình ảnh), **Audio spec** (âm thanh).

## 1. Nguyên tắc giao diện

1. **Điện thoại dọc trước.** Khung 360×640 trở lên, giãn tốt tới 430×932; trên máy tính, khung game ở giữa, tỉ lệ dọc.
2. **Một tay chơi được.** Nút hành động chính ở nửa dưới màn hình.
3. **Chạm để chọn, chạm để đặt.** Kéo-thả chỉ dùng trong mini-game cần cử chỉ (kéo lam, cấy ria, cắt microtome) và luôn có vùng chạm rộng.
4. **Vùng chạm ≥ 44×44 px**, khoảng cách ≥ 8 px.
5. **Màu không bao giờ là thông tin duy nhất:** nắp ống có chữ cái; Gram dương/âm có chữ khi soi ở mức Dễ; vạch test nhanh có độ đậm khác nhau rõ ràng.
6. **Chữ ≥ 14 px**; giờ, Niềm tin ≥ 16 px; tuỳ chọn chữ lớn.
7. **Thuật ngữ thật + giải thích ngắn:** lần đầu gặp, chạm vào từ có gạch chân chấm để xem 1 câu giải thích.
8. **Phản hồi trong 100 ms** cho mọi lần chạm.

## 2. Danh sách màn hình

| # | Màn hình | Nội dung chính |
|---|---|---|
| S1 | Mở đầu | Nút **Vào ca** (to nhất), Ca thử thách hôm nay, Ca tự do, Sổ tay, Cài đặt |
| S2 | Bản đồ chiến dịch | 7 chương, mỗi chương một dãy ngày có sao; huy hiệu khoa |
| S3 | Bảng giao ca | Ngày, khoa, việc tồn từ ca trước (đĩa đang ủ, khối nến...), điều mới hôm nay |
| S4 | **Phòng làm việc** (màn chơi chính, mỗi khoa một bố cục) | Mục 3 |
| S5 | Thẻ mẫu (lớp phủ) | Nhãn + phiếu + hình mẫu; Nhận / Từ chối (lý do) / Liên hệ |
| S6 | Mini-game (toàn màn hình) | Khung chung mục 4 |
| S7 | QC (lớp phủ, dừng giờ) | Biểu đồ Levey-Jennings hoặc kiểu QC của khoa; Đạt / Không đạt; menu khắc phục |
| S8 | Kết quả (LIS) | Phiếu, cờ, hành động |
| S9 | Cuộc gọi / Sự kiện (lớp phủ) | Ai gọi, nội dung, 2–3 lựa chọn |
| S10 | Báo cáo giao ca | Sao, 4 tiêu chí, "Chuyện hôm nay", Ngân sách, Chia sẻ |
| S11 | Thiết bị | Theo khoa; nâng cấp tốc độ và tự động hoá (khoá/mở) |
| S12 | Sổ tay KTV | Thẻ theo khoa, % sưu tập |
| S13 | Cài đặt | Độ khó, âm thanh, rung, chữ lớn, giảm chuyển động, xuất/nhập mã lưu, miễn trừ, giới thiệu |
| S14 | Đánh giá luân khoa / Kết thúc chiến dịch | |

## 3. Phòng làm việc

### 3.1. Khung chung (mọi khoa)

```
┌──────────────────────────────────┐
│ 09:42 ▓▓▓▓▓▓░░ Niềm tin 72   ⏸   │  ← giờ, Niềm tin, tạm dừng
│ [📥][🧪][🩸][🦠][🧫][🔬]          │  ← thanh chọn phòng (chỉ hiện ở chương 6)
│ 🚑 2 cấp cứu · 🔪 phòng mổ chờ    │  ← dòng cảnh báo khi có
├──────────────────────────────────┤
│  KHAY MẪU CỦA KHOA  → cuộn ngang │
├──────────────────────────────────┤
│                                  │
│   CÁC TRẠM CỦA KHOA (lưới 2 cột) │  ← mỗi trạm: tên, trạng thái, số mẫu
│                                  │
├──────────────────────────────────┤
│ [Phòng] [Kết quả •4] [📞] [Sổ tay]│
└──────────────────────────────────┘
```

### 3.2. Trạm theo khoa (lưới trên điện thoại)

| Khoa | Trạm hiển thị |
|---|---|
| 📥 Tiếp nhận | Bàn kiểm tra · 5 giỏ khoa · Tủ lạnh lưu mẫu |
| 🧪 Hoá sinh | Máy ly tâm · Khay sau ly tâm · Máy hoá sinh · Bàn nước tiểu |
| 🩸 Huyết học – Truyền máu | Máy đếm · Bàn lam + kính hiển vi · Máy đông máu · Bàn định nhóm · Tủ máu · Quầy phát máu |
| 🦠 Vi sinh – KST | Tủ an toàn sinh học · Tủ ấm (đĩa hôm qua) · Bàn nhuộm + kính · Bàn kháng sinh đồ · Máy cấy máu · Bàn ký sinh trùng |
| 🧫 Miễn dịch | Bàn test nhanh (đồng hồ hẹn giờ cho từng test) · Bàn ELISA · Máy miễn dịch |
| 🔬 GPB – TBH | Bàn nhận lọ mô + tủ hút · Máy xử lý mô · Bàn đúc nến · Microtome · Dàn nhuộm · Kính hiển vi · Máy cắt lạnh |

- Trạm có việc cần làm hiện chấm đỏ + số; trạm đang chạy hiện vòng tiến độ.
- Ở chương 6, phòng có việc gấp nhấp nháy trên thanh chọn phòng (tối đa 2 lần/giây).

## 4. Khung mini-game

```
┌──────────────────────────────────┐
│ Nhuộm Gram · bước 3/4   ⏱ 00:12  │  ← tên, tiến độ, thời gian
│ "Tẩy màu: giữ nút đến khi nước   │  ← 1 câu hướng dẫn (ẩn dần khi đã quen)
│  chảy hết màu tím"               │
├──────────────────────────────────┤
│                                  │
│          VÙNG THAO TÁC           │
│                                  │
├──────────────────────────────────┤
│ [? Sổ tay]          [Bỏ qua →]   │  ← bỏ qua = máy tự động (nếu đã mua) hoặc nhờ đồng nghiệp (mất thời gian)
└──────────────────────────────────┘
```

**Năm kiểu thao tác** (khớp `04a` mục 7):

| Kiểu | Cử chỉ | Ví dụ |
|---|---|---|
| Kéo đúng thứ tự | Kéo vật vào ô/bể theo trình tự | Nhuộm Gram, Nhuộm H&E, ELISA, Dọn đổ vỡ |
| Soi kính hiển vi | Vuốt để cuộn vi trường, chạm để đánh dấu, chọn loại từ bảng nhỏ | Đếm bạch cầu, Soi Gram, Soi phân, Soi sốt rét, Sàng lọc tế bào |
| Giữ đúng thời gian/nhịp | Giữ nút hoặc vuốt theo nhịp, có thanh "vùng tốt" | Tẩy màu Gram, Cắt microtome, Kéo lam |
| So sánh và đọc | So mẫu với bảng/chuẩn, chọn kết quả | Que nước tiểu, Test nhanh, Định nhóm, Đọc đĩa |
| Đo và tra bảng | Kéo thước, nhập số, tra bảng | Kháng sinh đồ, Pha loãng, S/CO |

**Kính hiển vi** là thành phần quan trọng nhất về hình ảnh: khung tròn, vuốt để đổi vi trường, có thanh đếm vi trường đã xem; hình vẽ tế bào/vi khuẩn/trứng giun dạng phẳng như sách giáo khoa, sinh ngẫu nhiên vị trí theo hạt giống.

## 5. Phong cách hình ảnh

- **Phong cách:** 2D phẳng, viền mềm, góc bo tròn; nhân vật chibi đơn giản; hình khoa học vẽ kiểu **minh hoạ sách giáo khoa**, rõ ràng, không chân thực ghê sợ.
- **Màu nền mỗi khoa** (nhấn nhẹ để người chơi biết đang ở đâu): Tiếp nhận xám xanh · Hoá sinh vàng nhạt · Huyết học – Truyền máu đỏ hồng nhạt · Vi sinh xanh lá nhạt · Miễn dịch tím nhạt · GPB hồng cam nhạt.
- **Màu cảnh báo** (đỏ) chỉ dùng cho ‼️, cấp cứu, sự cố.
- **Màu chuyên môn phải đúng:** nắp ống theo chuẩn; Gram dương tím, Gram âm hồng; H&E nhân xanh tím, bào tương hồng; Giemsa nhân ký sinh trùng đỏ tím, bào tương xanh; MacConkey khuẩn lạc hồng.
- **Không hình ảnh ghê sợ:** không vết thương, không kim tiêm cận cảnh, không nội tạng; mẫu mô là khối hồng nhạt trong lọ.
- **Chế độ tối:** có; màu định nghĩa bằng token.
- **Phông:** hỗ trợ đầy đủ dấu tiếng Việt (ví dụ "Be Vietnam Pro", "Nunito"); kiểm tra dấu chồng.

### Danh sách tài sản hình ảnh (ước lượng cho toàn bộ 5 khoa)

| Nhóm | Số lượng ước tính | Ghi chú |
|---|---|---|
| Ống, lọ, chai, que, lam | ~15 loại × trạng thái | SVG, đổi màu bằng code |
| Máy và trạm | ~25 (mỗi máy: nghỉ, chạy, lỗi) | |
| Nhân vật | 6 người hướng dẫn + kỹ sư + bác sĩ, mỗi người 2–3 biểu cảm | Chân dung nhỏ |
| Tế bào máu | 5 bạch cầu + tế bào non + hồng cầu + tiểu cầu, mỗi loại 3–4 biến thể | |
| Vi khuẩn | Cầu chùm, cầu chuỗi, trực khuẩn × Gram dương/âm | |
| Khuẩn lạc trên đĩa | ~8 kiểu (tan máu beta/alpha/gamma, hồng/không màu trên MacConkey, nấm tạp nhiễm) | |
| Ký sinh trùng | 3 trứng giun + bẫy (bọt khí, tinh bột); P. falciparum, P. vivax (3–4 thể) | |
| Miễn dịch | Khay test nhanh (C/T đậm, mờ, không hợp lệ), đĩa ELISA | |
| GPB | Lọ mô, khuôn, khối nến, dải lát cắt, lam H&E (đạt, gấp nếp, bọt khí, nhạt, đậm), tế bào bình thường/đáng ngờ | |
| Biểu tượng | ~50 | Bộ icon giấy phép mở |
| Thẻ Sổ tay | ~80 hình nhỏ | Tái dùng hình ở trên |
| Thẻ chia sẻ | 1 mẫu 1080×1350 (đổi màu theo khoa) | Vẽ bằng code |

**Nguồn tài sản:** tự vẽ SVG phẳng (có thể dùng AI để phác thảo ý tưởng, kiểm tra điều khoản sử dụng của công cụ); tham khảo hình thật từ nguồn mở (CDC DPDx, Wikimedia Commons) để vẽ lại cho đúng đặc điểm, **không** dùng trực tiếp ảnh hiển vi thật nếu giấy phép không cho phép. Ghi mọi tài sản ngoài vào `CREDITS`.

## 6. Âm thanh

- **Không khí theo khoa:** Hoá sinh tiếng máy rì rì, bíp; Vi sinh yên tĩnh, tiếng quạt tủ an toàn sinh học; GPB tiếng microtome lạch cạch; Truyền máu tiếng tủ lạnh, nhịp chậm căng thẳng; ca đêm nhạc nền trầm hơn.
- **Hiệu ứng chính:** chạm/chọn, đặt ống, máy ly tâm quay/dừng/rung lệch, máy báo xong, cảnh báo QC, chuông điện thoại, cấp cứu tới, phòng mổ gọi, đúng, sai, sủi bọt catalase, tiếng dao microtome, đồng hồ hẹn giờ test nhanh, kết thúc ca, nhận sao.
- **Nguồn:** CC0 hoặc gói bản quyền; ghi `CREDITS`.
- Mọi thông tin quan trọng có tín hiệu hình, không chỉ âm thanh.

## 7. Khả năng tiếp cận

- Màu + chữ/hình cho mọi thông tin màu sắc.
- Độ khó Dễ: đồng hồ chậm, gợi ý bước.
- Tuỳ chọn: chữ lớn, giảm chuyển động, tắt rung, **chế độ hỗ trợ cử chỉ** (mini-game cần nhịp/vuốt có thể thay bằng chạm nút, đổi lại điểm Tay nghề tối đa thấp hơn).
- Tương phản chữ WCAG AA (≥ 4,5:1); không nhấp nháy quá 3 lần/giây.

## 8. Giọng văn

- Viết cho người từ 13 tuổi: câu ngắn, thân thiện, dùng thuật ngữ thật kèm giải thích khi gặp lần đầu.
- Mỗi người hướng dẫn có giọng riêng: chị Hạnh nhanh nhẹn; anh Minh nghiêm túc, hay nhắc "kiểm tra lại lần nữa"; chị Lan nói chuyện với đĩa thạch; anh Khoa nói bằng con số; cô Thu chậm rãi, tỉ mỉ.
- Hài kiểu đồng nghiệp, không chế giễu bệnh nhân hay nghề nào; không từ ngữ thô.
- Mọi chuỗi chữ nằm trong file ngôn ngữ (không viết cứng).
