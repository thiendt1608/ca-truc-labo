# Changelog

## [Unreleased]

### Changed

- Sau playtest 10/2026 (`docs/10-playtest-redesign.md`): người chơi mới bắt đầu ở mức Dễ; ống trong khay có thanh
  kiên nhẫn thay cho số phút; biển phòng gọn (gợi ý chạm chỉ hiện tới quyết định đầu tiên); giỏ khoa vẽ ống nằm trong
  giỏ, "Đã từ chối" thành thùng 🗑️, bỏ ô "Đã xử lý".
- Thẻ mẫu: bảng so khớp theo hàng (Phiếu | Nhãn). Từ chối bằng cách chạm vào chỗ sai (hàng tên/năm/mã, hàng giờ,
  hoặc chính cái ống) thay vì chọn lý do trong danh sách chữ.
- Niềm tin tăng/giảm hiện bằng số bay cạnh thanh Niềm tin thay cho thông báo "+N Niềm tin".

### Added

- Chuyển động: tấm trượt lên, ống nảy vào khay, tem KHẨN lắc, thông báo trượt vào, sao ở báo cáo bật lần lượt.
- Hiệu ứng quyết định ở bàn tiếp nhận: dấu ✓/✗, ống bay vào đúng giỏ/thùng. Tắt khi bật Giảm chuyển động.

### Fixed

- Đồng hồ trông như đứng im: mẹo của người hướng dẫn giữ giờ tới khi được chạm, mà người chơi tưởng là lời thoại nên
  không chạm. Giờ mẹo tự đóng sau thời gian đọc (4–9 giây, có thanh đếm ngược) và đóng luôn khi người chơi mở thẻ
  mẫu hay máy.
- Đồng hồ không còn cập nhật store mỗi khung hình (phần lẻ giây để ngoài store).
