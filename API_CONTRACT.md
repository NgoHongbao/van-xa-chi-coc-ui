# API Contract — Guild Manager Backend/Render Update

## Health

```http
GET /api/health
```

```json
{ "status": "ok", "message": "Guild Manager API is running" }
```

## Snapshot

```http
GET /api/snapshot
```

Frontend snapshot vẫn giữ cấu trúc Đoàn → PT để render UI. Mỗi PT có `members` là assignment trực tiếp theo position `1..6`.

## Members

```http
GET    /api/members
GET    /api/members/:id
POST   /api/members
PUT    /api/members/:id
DELETE /api/members/:id
```

Member backend:

```json
{
  "id": "m01",
  "name": "Bae Hera",
  "factionId": "huyet-ha",
  "roleId": "r_member",
  "note": "...",
  "partyId": "p11",
  "position": 1,
  "ptNote": "LEAD",
  "ptNoteColor": "red"
}
```

## Factions

```http
GET /api/factions
```

Toái Mộng:

```json
{ "id": "toai-mong", "name": "Toái Mộng", "color": "#4adede" }
```

## Parties

```http
GET    /api/parties
GET    /api/parties/:id
POST   /api/parties
PUT    /api/parties/:id
DELETE /api/parties/:id
```

Party:

```json
{ "id": "p11", "legionId": "l1", "name": "PT1", "note": "", "order": 1 }
```

## Capacity

```text
PARTY_CAPACITY = 6
position = 1..6
```

## Assign Member

```http
POST /api/parties/assign-member
```

```json
{
  "memberId": "m07",
  "partyId": "p12",
  "targetPosition": 4,
  "note": "Nói dây",
  "noteColor": "blue"
}
```

## MOVE / REORDER

```http
PATCH /api/parties/move-member
```

```json
{
  "memberId": "m01",
  "targetPartyId": "p12",
  "targetPosition": 3
}
```

Rules:

- Target trống → MOVE.
- Cùng PT → REORDER.
- Target PT 6/6 và target trống → reject.
- Target có member → SWAP.

## SWAP

```http
PATCH /api/parties/swap-members
```

```json
{
  "memberAId": "m01",
  "memberBId": "m19"
}
```

Hai member đổi `partyId + position`. PT đầy vẫn SWAP được. PT Note giữ theo member.

## PT Note

```http
PATCH /api/parties/member/:memberId/note
```

```json
{ "note": "LEAD", "noteColor": "red" }
```

## Remove From Party

```http
DELETE /api/parties/member/:memberId
```

## Roles

```http
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
```

## Global Notes

```http
PUT /api/global-notes
```

## Errors

```json
{
  "success": false,
  "code": "PARTY_FULL",
  "message": "PT đã đủ 6 thành viên."
}
```


## Render wake-up behavior

`GET /api/health` là endpoint frontend dùng trước khi load snapshot khi chạy `API_MODE=backend`. Frontend retry GET khi gặp lỗi mạng hoặc 502/503/504; backend không implement keep-alive.
