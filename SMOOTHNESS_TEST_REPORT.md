# Smoothness Fix - Test Report

## Static / data checks

- Frontend JS syntax: PASS
- Backend JS syntax: PASS
- MongoDB-ready data validation: PASS
- Members: 74
- Factions: 7
- Roles: 16
- Parties: 10
- Legions: 3

## Code-path checks

- Drag & Drop no longer executes `setSnapshot(await api.getSnapshot()); render();` after successful write: PASS
- Drag optimistic render uses viewport-preserving renderer: PASS
- Member Pool scroll is preserved across formation render: PASS
- Main Content scroll is preserved across formation render: PASS
- Formation mutations are serialized while backend write is pending: PASS
- API failure still rolls back optimistic snapshot: PASS
- Legion screenshot does not add screenshot class to live legion: PASS
- Screenshot uses off-screen clone: PASS
- Screenshot does not mutate live scroll position: PASS
- Screenshot PNG uses Blob export: PASS

## Notes

Browser performance still depends on device speed because html2canvas must rasterize the image on the client. The fix removes visible layout jumps; a short CPU pause may still occur on very weak devices while the canvas is rendered.
