export const PARTY_CAPACITY = 6;

// Dữ liệu mặc định chỉ dùng để seed fake database (LocalStorage).
// UI luôn resolve faction từ snapshot/API thay vì hard-code theo member.
export const DEFAULT_FACTIONS = Object.freeze([
  { id: 'huyet-ha', name: 'Huyết Hà', color: '#ef4444' },
  { id: 'than-tuong', name: 'Thần Tương', color: '#1d4ed8' },
  { id: 'toai-mong', name: 'Toái Mộng', color: '#4adede' },
  { id: 'thiet-y', name: 'Thiết Y', color: '#facc15' },
  { id: 'to-van', name: 'Tố Vấn', color: '#f472b6' },
  { id: 'long-ngam', name: 'Long Ngâm', color: '#86efac' },
  { id: 'cuu-linh', name: 'Cửu Linh', color: '#a855f7' }
]);

export const PT_NOTE_COLORS = Object.freeze([
  { id: 'purple', label: 'Tím', color: '#c4b5fd' },
  { id: 'red', label: 'Đỏ', color: '#f87171' },
  { id: 'yellow', label: 'Vàng', color: '#facc15' },
  { id: 'green', label: 'Xanh lá', color: '#86efac' },
  { id: 'blue', label: 'Xanh dương', color: '#60a5fa' },
  { id: 'pink', label: 'Hồng', color: '#f9a8d4' }
]);

export const DEFAULT_PT_NOTE_COLOR = 'purple';
