# Update — Layout / Render Sleep

- Giữ roster 74 thành viên hiện tại trong Mock API và backend seed/runtime data.
- Party grid desktop tối đa 4 PT mỗi row; responsive giảm cột tự động.
- Screenshot từng Đoàn dùng layout 4 PT/row ở screenshot mode và giữ faction/PT Note color.
- Đã xóa toàn bộ màn hình/state/API/mock data theo dõi thay đổi trước đây.
- Backend snapshot không còn trả dữ liệu theo dõi thay đổi.
- Render backend sleep: frontend health check trước khi load, retry GET tối đa 3 lần với delay 2.5 giây.
- Khi đang wake hiển thị trạng thái kết nối thân thiện.
- Retry thất bại có nút `Thử lại`.
- Không thêm keep-alive/cron/ping định kỳ.
- Drag & Drop, MOVE, SWAP, Search, Faction Color, PT Note, Sidebar, Screenshot và Node.js backend được giữ nguyên ngoài các thay đổi trên.


## Roster 74 + MongoDB import data

- Đồng bộ lại chính xác 74 member, 7 faction và 16 role từ file roster người dùng cung cấp.
- Không thêm Cấp, Lực chiến, Ngày vào bang hoặc Online/Offline vì project không dùng.
- Đồng bộ runtime JSON và seed JSON.
- Thêm `backend/mongodb/import/` cho factions, roles, members, legions, parties, globalNotes.
- Thêm script PowerShell/Bash sử dụng `mongoimport`.
- Thêm `npm run mongo:data:validate` để kiểm tra referential integrity trước khi import.
- Không thay đổi UI, Drag & Drop, MOVE/SWAP, Search, Faction Color, PT Note, Screenshot hoặc Render sleep UX.


## Fix - Member Pool Faction Filter
- Fixed the faction filter below Global Note not hiding non-matching members.
- Root cause: `.member-pool-item { display: grid }` overrode the earlier `.hidden { display: none }` rule.
- Filter now uses both the native `hidden` attribute and a scoped CSS rule with `display:none !important`.
- Member count and empty state update with the selected faction.
- No UI/design, Drag & Drop, theme, backend, or roster data changes.

## 2026-08-17 - Smooth Real API Drag & Drop + Screenshot

- Giảm giật khi Drag & Drop với Real API:
  - Optimistic UI chỉ render một lần.
  - Không `GET /snapshot` + render toàn trang lần thứ hai ngay sau PATCH thành công.
  - Giữ nguyên `scrollTop/scrollLeft` của `.main-content` và danh sách thành viên bên phải khi render đội hình.
  - Serialize formation mutation để MOVE/SWAP không chạy chồng khi mạng chậm.
  - Nếu write API lỗi, rollback snapshot và render lại đúng vị trí scroll cũ.
- Screenshot không còn thay đổi layout đang hiển thị:
  - Clone DOM cần chụp vào vùng off-screen.
  - Screenshot mode chỉ áp dụng trên clone.
  - UI thật không đổi width/class/scroll trong lúc chụp.
  - Không đổi text/kích thước nút chụp trong lúc capture.
  - Dùng `canvas.toBlob()` thay cho `toDataURL()` để giảm block khi encode ảnh PNG.
- Không thay đổi dữ liệu, MongoDB import data, Drag & Drop business rules, faction, role, member, PT Note hoặc theme.
