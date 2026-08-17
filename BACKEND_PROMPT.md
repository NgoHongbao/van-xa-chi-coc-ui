# BACKEND PROMPT — Guild Manager Render-ready

## Mục tiêu

Tiếp tục backend Guild Manager hiện tại mà không redesign frontend. Backend dùng Node.js/Express và hiện tại dùng JSON/local data, chưa kết nối MongoDB.

## Bắt buộc giữ

- Drag & Drop.
- MOVE, SWAP, REORDER.
- Search Member.
- Faction color.
- PT Note + màu.
- Screenshot trang và từng Đoàn.
- Role/chức vụ.
- Member Note.
- Fake API frontend.
- Sidebar collapse/expand.

## Constants

```text
PARTY_CAPACITY = 6
POSITION_MIN = 1
POSITION_MAX = 6
```

## Faction Entity

```text
Faction
- id
- name
- color
```

Có đúng 7 phái. Toái Mộng bắt buộc `#4adede`.

## Member Entity

```text
Member
- id
- name
- factionId
- roleId
- note
- partyId
- position
- ptNote
- ptNoteColor
```

`partyId + position` là placement. Không thêm tầng chia nhỏ bên trong PT.

## Party Entity

```text
Party
- id
- legionId
- name
- note
- order
```

Một PT chứa trực tiếp tối đa 6 member.

## Business Rules

- Position hợp lệ: `1..6`.
- Một member chỉ có một placement.
- Trong một PT, một position chỉ có một member.
- MOVE sang target trống được phép nếu capacity hợp lệ.
- REORDER trong cùng PT không làm tăng capacity.
- MOVE sang PT đã 6/6 → reject.
- SWAP với member trong PT 6/6 → allow.
- SWAP phải cập nhật cả hai member hoặc không ai thay đổi.
- PT Note/màu PT Note đi theo member, không đi theo position.
- Không duplicate member.

## API

```http
GET /api/health
GET /api/snapshot

GET /api/members
GET /api/members/:id
POST /api/members
PUT /api/members/:id
DELETE /api/members/:id

GET /api/factions

GET /api/parties
GET /api/parties/:id
POST /api/parties
PUT /api/parties/:id
DELETE /api/parties/:id

POST  /api/parties/assign-member
PATCH /api/parties/move-member
PATCH /api/parties/swap-members
PATCH /api/parties/member/:memberId/note
DELETE /api/parties/member/:memberId
```

## MOVE API

```json
{
  "memberId": "m01",
  "targetPartyId": "p12",
  "targetPosition": 3
}
```

Nếu target position có member, backend có thể xử lý như SWAP theo specification hiện tại.

## SWAP API

```json
{
  "memberAId": "m01",
  "memberBId": "m19"
}
```

Chỉ đổi placement `partyId + position`; không đổi faction, role, Member Note, PT Note hoặc màu PT Note.

## JSON Repository

Current flow:

```text
Route → Controller → Service → JSON Repository → src/data/*.json
```

Dữ liệu tách theo entity. Không dùng Mongoose, MongoDB URI hoặc Atlas ở bản hiện tại.

## Render

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- `start = node src/server.js`
- server dùng `process.env.PORT`
- CORS dùng `FRONTEND_URL`
- health check `/api/health`

## MongoDB Migration

Sau này chỉ thay Repository/Data Source. Khi chuyển SWAP sang MongoDB, dùng transaction/session để bảo đảm atomic ở database.


## Render sleep note

Không tạo cron job, keep-alive hoặc ping định kỳ. Backend chỉ cung cấp `GET /api/health`. Frontend chịu trách nhiệm loading/retry/error UX khi Render đang spin up.

## Current roster

Giữ nguyên sample roster 74 thành viên trong `members.json`/seed. Không thêm các field game không dùng trong Guild Manager.


## MongoDB import dataset hiện có

Project đã có `backend/mongodb/import/` với dữ liệu chuẩn của 7 factions, 16 roles, 74 members, 3 legions, 10 parties và globalNotes. Khi implement MongoDB repository sau này, ưu tiên giữ nguyên application IDs dạng string (`id`) và API contract hiện tại. Không duplicate faction/role name hoặc color vào member; member chỉ tham chiếu `factionId` và `roleId`.
