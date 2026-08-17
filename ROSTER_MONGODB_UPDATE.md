# Roster / MongoDB update summary

Nguồn roster đã đồng bộ: `guild-manager-roster-data-74(2).zip`.

- Members: 74
- Factions: 7
- Roles: 16
- Parties giữ từ project: 10
- Legions giữ từ project: 3
- Party capacity: 6
- Toái Mộng color: `#4adede`
- 74 member hiện chưa được gán PT (`partyId = null`, `position = null`) vì file roster không cung cấp đội hình.
- Các field không dùng trong Guild Manager (cấp, lực chiến, ngày vào bang, online/offline) không được import.

MongoDB-ready files nằm tại `backend/mongodb/import/`.

## Member Pool / Theme update

Update giao diện mới không làm thay đổi MongoDB schema:

- Member Pool đọc trực tiếp collection `members` + `factions` và vị trí PT hiện có.
- Kéo member chưa có PT dùng API assign hiện tại để cập nhật `partyId`, `position`, `ptNote`, `ptNoteColor`.
- MOVE/SWAP tiếp tục cập nhật placement hiện có.
- Dark/White theme là preference cục bộ (`localStorage`) nên không thêm field theme vào MongoDB.

Bộ `backend/mongodb/import/` vẫn là source data import-ready mới nhất với 74 member.
