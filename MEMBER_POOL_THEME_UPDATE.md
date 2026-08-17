# Member Pool / Faction Filter / Theme Update

## Đã thực hiện

1. Panel thành viên nằm dưới Ghi chú chung ở trang Tổng quan.
2. Filter panel theo 7 Phái từ snapshot/API, không hard-code danh sách ở component.
3. 74 member hiện tại được hiển thị, có trạng thái Chưa xếp PT hoặc Đoàn/PT/Position.
4. Drag member chưa có PT → position trống = ASSIGN.
5. Drag member đã có PT → position trống = MOVE/REORDER; drop lên member = SWAP.
6. Modal Thêm thành viên bỏ Search, thay bằng Phái → Thành viên.
7. Dark mode + White mode, lưu LocalStorage.
8. White mode giữ Faction Color, Toái Mộng #4adede và màu PT Note.
9. Screenshot tự chọn background theo theme.
10. Backend API/schema và MongoDB import data không bị thay đổi.

## Data MongoDB

Bộ import vẫn nằm trong `backend/mongodb/import/`:

- factions: 7
- roles: 16
- members: 74
- legions: 3
- parties: 10
- globalNotes: 0

Theme không cần field trong MongoDB.
