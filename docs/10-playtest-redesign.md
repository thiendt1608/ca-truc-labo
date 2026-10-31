# 10. Playtest 10/2026: chẩn đoán và hướng làm lại cảm giác chơi

Một người chơi mới thử game rồi nêu 8 ý: (1) khó, khó hiểu; (2) như trò trả lời câu hỏi; (3) giống trang quiz hơn
game 2D; (4) nhiều chữ, rối mắt; (5) đơ, cứng; (6) chán; (7) giao diện xấu, phức tạp; (8) mọi thứ trôi quá nhanh.
Tài liệu này ghi lại nguyên nhân (đã tự chơi lại ngày 0.1, 0.2, 1.1 ở 390×844), nguồn tham khảo và phần đã sửa.

## 1. Nguyên nhân

| Ý | Nguyên nhân thấy được khi chơi |
| --- | --- |
| 2, 3, 6 | Vòng chơi chính là đọc hai cột chữ rồi bấm nút chữ. Từ chối = chọn 1 trong 5 dòng chữ. QC = chọn Đạt / Cảnh báo / Không đạt. Mini-game dọn đổ vỡ là danh sách 5 nút chữ bấm theo thứ tự. Giỏ khoa chỉ là bộ đếm "N ống", không tương tác. |
| 5 | Không phải lag: đo không có long task, ~119 fps. Cứng vì không có chuyển động: tấm, ống, dấu xuất hiện/biến mất tức thì; quyết định đúng không có phản hồi nào. Phụ: `carry` của đồng hồ nằm trong Zustand nên store cập nhật ~178 lần/giây. |
| 4, 7 | Biển phòng có câu đếm ("N ống đang chờ · N quyết định") và dòng gợi ý cố định; mỗi ống trong khay có "S3 · 4′"; thẻ mẫu hai cột chữ dài; ô "Đã xử lý" thừa. |
| 8 | ~25 giây game mỗi giây thực nên số phút trên ống nhảy liên tục; mẹo hiện sau khi đã làm (dạy muộn) và dừng/thả giờ đột ngột. |
| 1 | Người chơi mới vào thẳng mức Thường (không gợi ý). |

## 2. Rút ra từ nguồn tham khảo

- **Soi giấy tờ và chỉ vào chỗ sai** (Papers, Please): người chơi chạm vào chỗ mâu thuẫn chứ không chọn chữ
  trong danh sách. Kiến thức nằm trong hành động, không phải câu hỏi. [dukope devlog](https://dukope.com/devlogs/papers-please/tig-00),
  [Tampere PlayLab](https://blogs.tuni.fi/playlab/game-research-highlights/papers-please-succeeds-in-replicating-webers-iron-cage-of-bureaucracy-in-video-game-form/).
- **Thanh kiên nhẫn bằng hình, không bằng số** (Diner Dash, order-fulfillment games).
  [Gaming Nexus](https://gamingnexus.com/Article/2554/Diner-Dash), [Nelson & cs., FDG 2019](https://www.kmjn.org/publications/OrderFulfillment_FDG19-abstract.html).
- **Game feel / "juice"**: mỗi hành động có phản hồi tức thì, tương xứng, và luôn trở về trạng thái nghỉ.
  [Game Feel (Uni Bayreuth)](https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf),
  [GameAnalytics](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design), [Wayline](https://www.wayline.io/learn/game-feel).
- **Dạy bằng chơi, bỏ tường chữ**: một khái niệm mỗi lần, đúng lúc cần.
  [GDevelop](https://gdevelop.io/blog/improve-game-tutorials), [Wayline](https://www.wayline.io/blog/teach-through-play-ditch-the-walls-of-text).
- **Tránh "sô-cô-la phủ bông cải"**: nội dung học phải là cơ chế chơi (intrinsic integration).
  [Habgood, Zombie Division](https://www.de.ed.ac.uk/node/435), [Habgood & Ainsworth](https://eprints.nottingham.ac.uk/10385),
  [Cutting & Iacovides](https://eprints.whiterose.ac.uk/189921/1/LearningByDoingCuttingAndIacovides090822.pdf),
  [KQED MindShift](https://www.kqed.org/mindshift/20765/whats-the-secret-sauce-to-a-great-educational-game).
- **Ấm, ít áp lực, phản hồi rõ** (Good Pizza, Great Pizza). [Wikipedia](https://en.wikipedia.org/wiki/Good_Pizza,_Great_Pizza).
- **Chỉ animate transform/opacity** để chạy trên compositor. [Viget](https://www.viget.com/articles/animation-performance-101-browser-under-the-hood/).
- **Bớt HUD, UI theo ngữ cảnh**. [Game Developer](https://www.gamedeveloper.com/design/game-ui-discoveries-what-players-want),
  [Wayline](https://www.wayline.io/blog/your-ui-is-killing-immersion-fix-it).

## 3. Giai đoạn 1 (đã làm; giữ kiến trúc DOM/React, không đổi luật trong `src/sim`)

- **Nhịp**: bản lưu mới bắt đầu ở mức **Dễ** (bản lưu cũ giữ mức đã chọn). Số phút "S3 · 4′" trên ống thay bằng
  **thanh kiên nhẫn** (xanh → vàng → đỏ theo `tat.reception` ở tiếp nhận, theo hạn phiếu ở phòng khoa).
  `carry` của đồng hồ chuyển ra biến module (không cập nhật store mỗi khung hình).
- **Cảm giác chơi** (`src/store/fx.ts` + `src/ui/components/FxLayer.tsx`, chỉ transform/opacity, tắt khi Giảm chuyển động):
  tấm trượt lên, nền mờ dần; ống mới nảy vào khay, tem KHẨN lắc; thông báo trượt vào; quyết định ở tiếp nhận có dấu
  ✓/✗ to, ống bay vào đúng giỏ/thùng và giỏ nảy; Niềm tin đổi thì số bay cạnh thanh Niềm tin (thay thông báo "+N
  Niềm tin"), tụt thì thanh rung; sao ở báo cáo bật lần lượt. Ở phòng khoa không vẽ ✓/✗ vì lỗi ẩn chỉ lộ khi duyệt.
- **Bớt chữ**: biển phòng chỉ còn tên phòng, ngày, tiến độ; gợi ý "Chạm vào ống" chỉ tới quyết định đầu tiên. Giỏ khoa
  vẽ các ống nhỏ nằm trong giỏ; "Đã từ chối" thành thùng 🗑️; bỏ ô "Đã xử lý".
- **Thẻ mẫu**: thông tin phiếu gọn ở trên; bảng so khớp **theo hàng** (Họ tên / Năm sinh / Mã BN / Giờ: Phiếu | Nhãn).
  **Từ chối = chạm vào chỗ sai**: hàng tên/năm/mã (hoặc "Không có nhãn") → sai định danh; hàng giờ → để quá giờ; chạm
  vào ống → chọn 🧪 sai loại ống / 📉 thiếu thể tích / 💧 rò rỉ. Lõi vẫn nhận `rejectSample{reason}` như cũ.

## 4. Giai đoạn 2 (đề xuất, cần chủ dự án chọn)

1. Mini-game dọn đổ vỡ và QC thành cảnh có hình (vũng dịch + thẻ dụng cụ kéo thả; QC chạm điểm lệch trên biểu đồ).
2. Phòng vẽ thành cảnh (bàn, giỏ, máy) thay lưới thẻ; kéo ống từ khay vào giỏ.
3. Hướng dẫn trong lúc chơi: mũi tên chỉ đúng chỗ khi cần, mẹo không còn hiện sau hành động.
4. Âm thanh (GDD có, M3-5 đang hoãn) vì phản hồi âm thanh là nửa còn lại của "juice".
