# Changelog

## [Unreleased]

### Changed

- Sau playtest 10/2026 (`docs/10-playtest-redesign.md`): người chơi mới bắt đầu ở mức Dễ; ống trong khay có thanh
  kiên nhẫn thay cho số phút; biển phòng gọn (gợi ý chạm chỉ hiện tới quyết định đầu tiên); giỏ khoa vẽ ống nằm trong
  giỏ, "Đã từ chối" thành thùng 🗑️, bỏ ô "Đã xử lý".
- Thẻ mẫu: bảng so khớp theo hàng (Phiếu | Nhãn). Từ chối bằng cách chạm vào chỗ sai (hàng tên/năm/mã, hàng giờ,
  hoặc chính cái ống) thay vì chọn lý do trong danh sách chữ.
- Niềm tin tăng/giảm hiện bằng số bay cạnh thanh Niềm tin thay cho thông báo "+N Niềm tin".
- Playtest lần 2: ở bàn tiếp nhận, thẻ mẫu cho bấm thẳng khoa nhận (một chạm thay cho "Nhận" rồi chọn khoa).
- Các tấm khay sau ly tâm, bàn nước tiểu và kết quả tự đóng khi vừa xử lý hết; bỏ ô "Kết quả" trùng với nút ở thanh
  dưới.
- Máy ly tâm: ống đã đặt vẫn giữ chỗ trong dãy (mờ, ghi số ô) nên các ống còn lại không dồn dưới ngón tay; dòng
  trạng thái rổ luôn chiếm chỗ để rổ không nhảy.
- Que nước tiểu: nhúng ngay khi mở, bỏ bước bấm "Nhúng que" lần hai.
- Lọ mô thiếu dịch nhìn rõ hơn: mức dịch thấp, mẫu mô nhô lên khỏi mặt dịch.

### Added

- Chuyển động: tấm trượt lên, ống nảy vào khay, tem KHẨN lắc, thông báo trượt vào, sao ở báo cáo bật lần lượt.
- Hiệu ứng quyết định ở bàn tiếp nhận: dấu ✓/✗, ống bay vào đúng giỏ/thùng. Tắt khi bật Giảm chuyển động.
- Nút "⏩ Tua tới mẫu kế" khi khay trống: giờ chạy ×4 tới khi có mẫu mới, máy xong, điện thoại reo hay sự cố.
- Dấu 📨 khi gửi kết quả ở phòng khoa (trung tính, không lộ đúng/sai).

### Fixed

- Đồng hồ trông như đứng im: mẹo của người hướng dẫn giữ giờ tới khi được chạm, mà người chơi tưởng là lời thoại nên
  không chạm. Giờ mẹo tự đóng sau thời gian đọc (4–9 giây, có thanh đếm ngược) và đóng luôn khi người chơi mở thẻ
  mẫu hay máy.
- Đồng hồ không còn cập nhật store mỗi khung hình (phần lẻ giây để ngoài store).
