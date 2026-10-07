# CA TRỰC LABO — Concept v3

> Phiên bản: 3.0 · Ngày: 2026-10-07 · Thay thế: `01-concept-goc.md` và các bản v2.x
> Lý do thay đổi: `02-danh-gia-concept.md` (mục 4 và 5). Luật chơi: `04-GDD.md` (hệ thống chung) và `04a-GDD-cac-khoa.md` (từng khoa).
> **v3.0 (theo yêu cầu của Thien, 2026-10-07):** độ tuổi từ 13 trở lên; tăng độ đa dạng và độ sâu; mở rộng ra 5 chuyên ngành: Hoá sinh lâm sàng, Huyết học – Truyền máu, Vi sinh – Ký sinh trùng, Miễn dịch, Giải phẫu bệnh – Tế bào học. Kiến thức lấy theo giáo trình và tài liệu quốc tế, đơn giản hoá để dễ chơi; người chơi chưa biết gì học được qua quá trình chơi.

## 1. Pitch một câu

**CA TRỰC LABO** là game web miễn phí trên điện thoại, nơi bạn là kỹ thuật viên xét nghiệm mới ra trường, luân chuyển qua 5 khoa của một phòng xét nghiệm bệnh viện: chạy máy hoá sinh, định nhóm máu, nhuộm Gram, đọc test nhanh, cắt tiêu bản mô... và cố sống sót qua những ca trực ngày càng hỗn loạn.

**Câu truyền thông:** *"Một năm làm kỹ thuật viên xét nghiệm: 5 khoa, 1 ống máu sai tên, 3 đĩa thạch mọc nấm, 0 phút ăn trưa."*

## 2. Thể loại và nền tảng

- **Thể loại:** mô phỏng công việc + quản lý thời gian, xen các **mini-game kỹ thuật** ngắn (10–30 giây) lấy từ thao tác thật trong phòng xét nghiệm.
- **Nền tảng:** web, ưu tiên điện thoại dọc; chơi được trên máy tính; không cài, không đăng nhập; có thể cài lên màn hình chính (PWA).
- **Một phiên chơi:** một ca = **6–8 phút**.
- **Ngôn ngữ:** tiếng Việt, dùng thuật ngữ thật của ngành (có giải thích ngắn khi gặp lần đầu).
- **Miễn phí 100%:** không quảng cáo, không mua trong game, không thu dữ liệu cá nhân.

## 3. Người chơi

- **Từ 13 tuổi trở lên**, không cần biết gì về y khoa. Học sinh cấp 2–3 tò mò về ngành y, sinh viên các ngành sức khoẻ, người lớn thích game mô phỏng nghề.
- Người trong ngành (sinh viên, KTV) thấy quen, thấy hài, và có thể chơi ở độ khó cao.
- **Nguyên tắc:** người chưa biết gì vẫn chơi được nhờ hướng dẫn dần và Sổ tay; người biết nhiều chơi giỏi hơn. Mỗi luật có lý do khoa học thật, được giải thích bằng một câu.

## 4. Bốn trụ cột thiết kế

1. **Mỗi khoa một trải nghiệm** — hoá sinh là chạy đua với máy, truyền máu là cẩn thận tuyệt đối, vi sinh là kiên nhẫn qua nhiều ngày, miễn dịch là đọc tín hiệu, giải phẫu bệnh là khéo tay. Đổi khoa là đổi cảm giác chơi.
2. **Bận rộn có chiến thuật** — nhiều việc cùng lúc; phải chọn ưu tiên, chọn làm tay hay chờ máy, chọn kiểm tra kỹ hay làm nhanh.
3. **Học bằng tay** — kiến thức nằm trong thao tác: nhuộm Gram sai thứ tự thì vi khuẩn sai màu; quên đặt ống cân bằng thì máy ly tâm rung. Không có màn đọc lý thuyết bắt buộc.
4. **Đời và hài** — máy dở chứng, bác sĩ gọi đúng lúc bận nhất, phòng mổ chờ cắt lạnh, chưa được ăn trưa.

**Không làm (non-goals):** không chẩn đoán bệnh (KTV làm xét nghiệm, bác sĩ kết luận); không quiz trắc nghiệm; không hình ảnh ghê sợ (mô, máu chỉ là hình minh hoạ đơn giản); không 3D; không nhiều người chơi; không quảng cáo, không thu tiền.

## 5. Cấu trúc game

### 5.1. Phòng xét nghiệm Bệnh viện Đa khoa Labo Xanh (hư cấu)

| Khu | Người chơi làm gì (tóm tắt) |
|---|---|
| 📥 **Tiếp nhận mẫu** (chung) | Kiểm tra định danh, đúng loại ống/lọ, đủ lượng, đúng giờ; nhận hoặc từ chối; chuyển đúng khoa |
| 🧪 **Hoá sinh lâm sàng** | Ly tâm, xét mẫu tan huyết/đục/vàng, chạy máy hoá sinh, kiểm tra QC (luật Westgard), pha loãng, que thử nước tiểu, gọi báo giá trị nguy hiểm |
| 🩸 **Huyết học – Truyền máu** | Máy đếm tế bào, kéo và đọc lam máu, đông máu (ống citrate 9:1), định nhóm máu ABO/Rh, phản ứng chéo, chọn và phát túi máu |
| 🦠 **Vi sinh – Ký sinh trùng** | Cấy ria trên đĩa thạch, ủ qua đêm, đọc khuẩn lạc, nhuộm Gram, catalase, kháng sinh đồ, soi phân tìm trứng giun, soi lam máu tìm ký sinh trùng sốt rét |
| 🧫 **Miễn dịch** | Test nhanh (vạch C/T), làm ELISA, máy miễn dịch tự động; hiểu "sàng lọc phản ứng" khác "chẩn đoán" |
| 🔬 **Giải phẫu bệnh – Tế bào học** | Kiểm tra lọ mô và formalin, đúc khối nến, cắt microtome, nhuộm H&E, sàng lọc lam tế bào, cắt lạnh cho phòng mổ |

### 5.2. Chiến dịch "Năm đầu đi làm"

KTV mới **luân chuyển qua từng khoa**, giống thực tế nhiều bệnh viện:

| Chương | Nội dung | Số ngày |
|---|---|---|
| 0 | Tiếp nhận mẫu (học kiểm tra và chuyển mẫu tới 5 khoa) | 3 |
| 1 | Hoá sinh lâm sàng | 5 |
| 2 | Huyết học – Truyền máu | 6 |
| 3 | Vi sinh – Ký sinh trùng | 6 |
| 4 | Miễn dịch | 5 |
| 5 | Giải phẫu bệnh – Tế bào học | 5 |
| 6 | **Ca trực đêm tổng hợp**: một mình trông cả phòng xét nghiệm, chuyển qua lại giữa các khoa | 5 |

Hết mỗi chương có "đánh giá luân khoa". Hết chương 6 là kết thúc chiến dịch (đúng với tên game: ca trực).

Sau chiến dịch: **Ca tự do** (chọn khoa bất kỳ hoặc trực tổng hợp) và **Ca thử thách hằng ngày** (cùng một ca cho mọi người, chia sẻ điểm).

### 5.3. Ba vòng lặp

- **Từng mẫu (vài giây):** xem mẫu → nhận/từ chối → đưa đúng nơi.
- **Một ca (6–8 phút):** QC đầu ca → mẫu đổ về → xử lý ở các trạm của khoa + mini-game kỹ thuật → duyệt và trả kết quả → sự cố → báo cáo giao ca 1–5 sao.
- **Nhiều ngày:** sao → **Ngân sách khoa** → mua thiết bị. Nhiều thiết bị **tự động hoá** mini-game đã thành thạo (máy nhuộm Gram tự động, hệ thống định nhóm máu gel, máy nhuộm H&E...) — giống phòng xét nghiệm thật tiến từ làm tay sang tự động.

## 6. Thắng, thua, chấm điểm

- **Niềm tin** của khoa (0–100): sai sót nghiêm trọng (trả kết quả sai, phát nhầm nhóm máu, mất mẫu mô) trừ nhiều; trễ hẹn trừ ít. Về 0 → ca kết thúc sớm.
- **Báo cáo giao ca** 4 tiêu chí: **Chính xác**, **Đúng hẹn**, **An toàn người bệnh**, **Tay nghề** (chất lượng mini-game và QC). Tổng thành 1–5 sao.

## 7. Nhân vật

- **Bạn:** KTV mới ra trường.
- **Chị Hạnh** (KTV trưởng, Hoá sinh), **anh Minh** (Huyết học – Truyền máu, cực kỳ cẩn thận), **chị Lan** (Vi sinh, yêu đĩa thạch hơn người), **anh Khoa** (Miễn dịch, nói chuyện bằng số liệu), **cô Thu** (Giải phẫu bệnh, khéo tay nhất viện): mỗi người dẫn dắt một chương.
- **Anh Tuấn**, kỹ sư thiết bị: lúc nào cũng "đang tới".
- **Bác sĩ cấp cứu, phòng mổ, khoa lâm sàng:** gọi điện đúng lúc bạn bận nhất.

## 8. Độ khó

Ba mức chọn được bất cứ lúc nào (trừ Ca thử thách dùng mức Thường):
- **Dễ:** đồng hồ chậm, có gợi ý (ví dụ chấm màu ống trên phiếu, bước tiếp theo của quy trình nhuộm), không kết thúc ca sớm.
- **Thường:** không gợi ý.
- **Khó:** lỗi tinh vi hơn, nhiều sự kiện hơn, một số luật nâng cao (ví dụ luật Westgard 4-1s, 10x).

## 9. Phát hành theo từng phần

Game lớn hơn nhiều so với bản trước, nên làm và phát hành **theo chương**: bản đầu tiên gồm Tiếp nhận + Hoá sinh + Huyết học – Truyền máu; mỗi bản cập nhật sau thêm một khoa; cuối cùng là Ca trực đêm tổng hợp. Chi tiết: `08-ke-hoach-du-an.md`.

## 10. Rủi ro lớn nhất

1. **Phạm vi rất lớn cho một người làm** → phát hành theo chương; mỗi khoa dùng chung lõi (tiếp nhận, máy, QC, kết quả), chỉ khác trạm và mini-game.
2. **Quá nhiều kiến thức làm người mới ngợp** → mỗi ngày chỉ mở 1–2 điều mới; mỗi chương có người hướng dẫn riêng; chế độ Dễ.
3. **Mini-game lặp lại gây chán** → mini-game ngắn, có thể tự động hoá bằng thiết bị khi đã thành thạo.
4. **Đơn giản hoá thành sai** → mỗi luật có nguồn (giáo trình, WHO, CLSI, CDC); bạn sinh viên ngành xét nghiệm xem qua.
