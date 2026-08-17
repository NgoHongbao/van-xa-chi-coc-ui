# Guild Manager — Bang Chiến Planner

Guild Manager là web quản lý đội hình bang theo phong cách dark gaming hiện tại. Bản này giữ nguyên Drag & Drop, MOVE, SWAP, Search Member, Faction Color, PT Note, Screenshot, Sidebar và backend Node.js; đồng thời dùng roster **74 thành viên** đã nhập từ ảnh bang.

## Features

- Dữ liệu mẫu 74 thành viên, đủ tên/phái/chức vụ cần cho project.
- Đoàn → PT → tối đa **6 member**, position `1 → 6`.
- Mỗi hàng desktop hiển thị tối đa **4 PT**; PT thứ 5 tự xuống hàng.
- Responsive tự giảm 4 → 3 → 2 → 1 cột tùy chiều rộng.
- Drag & Drop: REORDER, MOVE, SWAP trong/giữa PT và giữa các Đoàn.
- PT `6/6` vẫn SWAP được; MOVE vào PT đầy bị chặn.
- Search Member ổn định; Faction Color lấy từ data/API; Toái Mộng `#4adede`.
- Member Note, PT Note màu, screenshot toàn trang và từng Đoàn.
- Sidebar collapse/expand; khi ẩn main content full width.
- Mock API/LocalStorage và Node.js + Express backend JSON đều được giữ.
- Backend chưa kết nối MongoDB.

## Render sleep / wake UX

Khi `API_MODE: 'backend'`, frontend gọi `GET /api/health` trước khi load dữ liệu.

- Trong lúc Render đang wake: hiển thị **“Đang kết nối đến server...”** / **“Server đang khởi động, vui lòng chờ một chút...”**.
- Health check và các GET request có retry tự động, tối đa 3 lần retry, cách nhau khoảng 2.5 giây.
- Nếu vẫn thất bại: hiển thị **“Không thể kết nối đến server. Vui lòng thử lại.”** và nút **Thử lại**.
- Không có cron, interval hay keep-alive ping để giữ Render thức.

## Tech Stack

Frontend: HTML5, CSS3, JavaScript ES Modules, Node.js API, MongoDB Atlas, html2canvas.

Backend: Node.js 20+, Express, CORS, dotenv, JSON repository/local data.

## Project Structure

```text
index.html
css/styles.css
js/
  app.js
  api.js
  config.js
  constants.js
  fake-api.js
  api/real-api.js
  features/
  state/
  utils/
backend/
  package.json
  .env.example
  README.md
  src/
    app.js
    server.js
    routes/
    controllers/
    services/
    repositories/
    middleware/
    config/
    data/
ROSTER_DATA_74.json
```

## Frontend Installation

```bash
python -m http.server 3000
```

Mở `http://localhost:3000`.

Mặc định trong `index.html`:

```js
window.GUILD_MANAGER_CONFIG = {
  API_MODE: 'backend',
  API_BASE_URL: 'http://localhost:3001/api'
};
```

Frontend mặc định dùng `API_MODE: 'backend'` để đọc và lưu dữ liệu qua Node.js API/MongoDB.

## PT / Drag & Drop

`PARTY_CAPACITY = 6`. Mỗi member trong đội hình có `partyId + position`.

- Drop vào position trống → MOVE / REORDER.
- Drop lên member → SWAP.
- PT Note vẫn đi theo member.

## 74-member roster

Backend runtime/seed và Mock API đều dùng roster 74 member. Các field game không cần cho project (cấp, lực chiến, ngày vào bang, online/offline) không được đưa vào data.

## Backend / Render

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Health check: `GET /api/health`.

Render: Root Directory `backend`, Build Command `npm install`, Start Command `npm start`. Không dùng logic keep-alive.

Xem thêm `backend/README.md`.


## MongoDB-ready roster data

Bộ roster mới nhất từ file `guild-manager-roster-data-74(2).zip` đã được đồng bộ vào:

- `backend/src/data/factions.json`
- `backend/src/data/roles.json`
- `backend/src/data/members.json`
- `backend/src/data/seed/`
- `ROSTER_DATA_74.json`

Project còn có thư mục `backend/mongodb/import/` chứa **6 collection JSON** sẵn để đưa lên MongoDB: factions, roles, members, legions, parties và globalNotes.

Kiểm tra dữ liệu:

```bash
cd backend
npm run mongo:data:validate
```

Hướng dẫn import chi tiết: `backend/mongodb/README.md`. Runtime backend hiện tại vẫn dùng JSON repository; bộ MongoDB này là data import-ready để chuyển database khi cần mà không làm thay đổi frontend.

## Member Pool + Faction Filter

Trang **Tổng quan** có thêm panel **Danh sách thành viên** ở cột phải, nằm ngay dưới **Ghi chú chung**.

- Hiển thị roster hiện tại (74 member trong data mẫu).
- Filter theo `factionId`; tên/màu Phái vẫn resolve từ Faction data/API.
- Member chưa có PT có thể kéo trực tiếp vào position trống → dùng `assignMember`.
- Member đã có PT vẫn có thể kéo từ panel sang position trống → MOVE, hoặc thả lên member khác → SWAP.
- Member chưa có PT không được thả đè lên member đang có vị trí để tránh tự ý thay thế/mất member.
- Panel hiển thị trạng thái `Chưa xếp PT` hoặc vị trí Đoàn/PT hiện tại.

Modal **Thêm thành viên vào PT** không còn ô Search. Luồng mới là:

1. Chọn **Phái**.
2. Dropdown Thành viên chỉ hiện member chưa có PT thuộc phái đã chọn.
3. Chọn Đoàn/PT và thêm vào position trống đầu tiên.

Không có API mới cho tính năng này; frontend reuse `assign-member`, `move-member`, `swap-members` hiện có.

## Dark / White Theme

Project hỗ trợ 2 theme:

- **Dark mode**: giao diện gaming dark hiện tại.
- **White mode**: nền sáng với panel/border/text được cân lại tương phản, vẫn giữ accent Purple, màu Faction và màu PT Note.

Có thể đổi theme nhanh ở Sidebar hoặc vào **Cài đặt → Theme**. Theme được lưu trong LocalStorage với key `guild-manager-theme`, không lưu backend/MongoDB.

Screenshot dùng màu nền theo theme đang chọn. Faction color và PT Note color tiếp tục được giữ trong ảnh.
