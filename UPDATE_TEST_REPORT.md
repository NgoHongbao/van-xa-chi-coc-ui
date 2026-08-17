# Update Test Report

## Static / syntax checks

- JS syntax: PASS (`node --check` cho toàn bộ `js/` và `backend/src/`).
- Modal Thêm thành viên không còn `assign-search`: PASS.
- Member Pool có filter `member-pool-faction`: PASS.
- Theme module + Dark/White selectors: PASS.

## Data checks

- Members: 74
- Factions: 7
- Roles: 16
- Parties: 10
- Legions: 3
- Toái Mộng color: `#4adede`
- MongoDB import validation: PASS (`npm run mongo:data:validate`).

## Mock API behavior

- Member chưa có PT → `assignMember` vào position trống: PASS.
- SWAP giữa 2 member đã có PT: PASS.
- PT Note + PT Note Color đi theo đúng member khi SWAP: PASS.

## UI behavior implemented

- Panel thành viên bên phải, dưới Ghi chú chung.
- Filter theo Phái không re-render toàn trang.
- Kéo member chưa có PT vào ô trống → ASSIGN.
- Kéo member đã có PT → MOVE/SWAP/REORDER.
- Kéo member chưa có PT lên member khác → reject thân thiện, không thay thế member.
- Modal Thêm thành viên: Phái → Thành viên → Đoàn/PT.
- Dark / White theme; theme persist bằng LocalStorage.
- White mode có palette riêng và giữ Faction/PT Note color.
- Screenshot background theo theme hiện tại.


## Member Pool Filter Regression
- Selecting a faction hides members from other factions: PASS (implementation/cascade regression fixed).
- Selecting `Tất cả phái` restores all member cards: PASS.
- Visible member counter follows the filtered list: PASS.
- Empty-state visibility follows filter result: PASS.
