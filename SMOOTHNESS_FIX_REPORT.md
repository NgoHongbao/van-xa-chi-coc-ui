# Guild Manager - Real API / Screenshot Smoothness Fix

## Vấn đề 1: Drag & Drop bị giật khi dùng Real API

Nguyên nhân chính trong bản trước:

1. Sau drop, frontend cập nhật optimistic snapshot và gọi `render()`.
2. Sau PATCH thành công, frontend lại gọi `GET /snapshot` rồi `render()` lần thứ hai.
3. Mỗi `render()` thay toàn bộ `#page-root`, vì vậy scroll riêng của Member Pool bị reset về đầu.
4. Với mạng thật/Render, khoảng trễ giữa hai lần render làm hiện tượng nhảy/giật dễ thấy hơn.

### Cách sửa

- Giữ optimistic UI.
- Chỉ render một lần sau drop.
- PATCH thành công không render lần hai.
- Giữ và restore scroll của `.main-content` và `#member-pool-list` đồng bộ trong cùng task trước khi browser paint.
- Formation write được serialize để tránh hai MOVE/SWAP request chạy chồng và trả kết quả sai thứ tự.
- Nếu API write thất bại, rollback snapshot cũ và render lại với cùng viewport.

## Vấn đề 2: Chụp Đoàn làm UI bị giật

Nguyên nhân chính trong bản trước:

- Class `legion-screenshot-mode` được gắn trực tiếp lên Đoàn đang hiển thị.
- Width của card Đoàn bị đổi thành 1560px và grid chuyển layout trong UI thật.
- Text nút chụp cũng bị đổi trong lúc capture.
- Sau khi html2canvas xong mới trả layout về ban đầu.

### Cách sửa

- Clone Đoàn/app-shell sang một screenshot stage nằm ngoài màn hình.
- Áp dụng screenshot mode chỉ trên clone.
- html2canvas chụp clone, không chạm layout thật.
- Tắt animation/transition trên clone để ảnh ổn định.
- Không đổi text/width của nút chụp.
- PNG được tạo bằng `canvas.toBlob()` thay vì `canvas.toDataURL()`.

## Các phần không thay đổi

- 74 members và MongoDB-ready data.
- MOVE / SWAP / REORDER / ASSIGN rules.
- PT capacity = 6.
- Member Pool + faction filter.
- Faction colors và Toái Mộng `#4adede`.
- PT Note + PT Note color.
- Dark / White theme.
- Backend API contract và database model.
