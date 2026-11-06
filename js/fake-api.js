import { PARTY_CAPACITY, DEFAULT_FACTIONS, DEFAULT_PT_NOTE_COLOR, PT_NOTE_COLORS } from './constants.js';
import { firstEmptyPosition } from './state/formation.js';

const STORAGE_KEY = 'guild-manager-v3-direct-party';
const LEGACY_KEYS = ['guild-manager-v2', 'guild-manager-v1'];
const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
const validNoteColorIds = new Set(PT_NOTE_COLORS.map((item) => item.id));
const factionIdByName = (name) => DEFAULT_FACTIONS.find((item) => item.name === name)?.id || null;

const seedMembers = [
  ['member-001', 'Will', 'Toái Mộng', 'r_docnha_duong_chu', ''],
  ['member-002', 'Pánh Gấu', 'Tố Vấn', 'r_tam_duong_gia', ''],
  ['member-003', 'Thích Ăn Phở', 'Thiết Y', 'r_haclan_duong_chu', ''],
  ['member-004', 'KimYumi', 'Tố Vấn', 'r_haclan_pho_duong_chu', ''],
  ['member-005', 'Nguyệt Tỷ', 'Toái Mộng', 'r_docnha_pho_duong_chu', ''],
  ['member-006', 'Uraa', 'Long Ngâm', 'r_member', ''],
  ['member-007', 'CửuNguyệt', 'Tố Vấn', 'r_member', ''],
  ['member-008', 'Di Phương', 'Huyết Hà', 'r_member', ''],
  ['member-009', 'Tử Nguyệt D...', 'Thiết Y', 'r_member', ''],
  ['member-010', 'Chang Yêu ...', 'Tố Vấn', 'r_member', ''],
  ['member-011', 'Duy Hoanggg', 'Toái Mộng', 'r_hoc_viec', ''],
  ['member-012', 'baybkristen', 'Thần Tương', 'r_hoc_viec', ''],
  ['member-013', 'Bé Báo', 'Tố Vấn', 'r_hoc_viec', ''],
  ['member-014', 'Xàranghae', 'Long Ngâm', 'r_dai_duong_gia', ''],
  ['member-015', 'Tang Trĩ', 'Cửu Linh', 'r_tu_duong_gia', ''],
  ['member-016', 'Huyết Như ...', 'Huyết Hà', 'r_ngu_duong_gia', ''],
  ['member-017', 'Lệ Hoa Trì', 'Thần Tương', 'r_tanhan_duong_chu', ''],
  ['member-018', 'TomKaKa', 'Thần Tương', 'r_quan_su', ''],
  ['member-019', 'Ngọc Tú', 'Tố Vấn', 'r_nha_cong', ''],
  ['member-020', 'Chu Quân', 'Thần Tương', 'r_tanhan_duong_chung', ''],
  ['member-021', 'Liên Mị', 'Tố Vấn', 'r_haclan_duong_chung', ''],
  ['member-022', 'cá Neonn', 'Tố Vấn', 'r_member', ''],
  ['member-023', 'TiểuThanhB...', 'Thần Tương', 'r_member', ''],
  ['member-024', 'Nami_', 'Cửu Linh', 'r_member', ''],
  ['member-025', 'Đoàn Gia Hứa', 'Long Ngâm', 'r_member', ''],
  ['member-026', 'Shirouz', 'Thần Tương', 'r_member', ''],
  ['member-027', 'Shirunuki', 'Toái Mộng', 'r_member', ''],
  ['member-028', 'Hạt Nêm', 'Thiết Y', 'r_member', ''],
  ['member-029', 'Thu Cuối', 'Huyết Hà', 'r_member', ''],
  ['member-030', '6z_Wakaba...', 'Huyết Hà', 'r_member', ''],
  ['member-031', 'Hera', 'Tố Vấn', 'r_member', ''],
  ['member-032', 'DungCúc', 'Thần Tương', 'r_member', ''],
  ['member-033', 'gừng', 'Cửu Linh', 'r_member', ''],
  ['member-034', 'BúnTháiChu...', 'Toái Mộng', 'r_member', ''],
  ['member-035', 'NguyệtVũĐạ...', 'Tố Vấn', 'r_member', ''],
  ['member-036', 'Cither', 'Cửu Linh', 'r_member', ''],
  ['member-037', 'BabyBoo', 'Cửu Linh', 'r_member', ''],
  ['member-038', 'Đời tệ với nó', 'Thần Tương', 'r_member', ''],
  ['member-039', 'Cẩm Ni', 'Tố Vấn', 'r_member', ''],
  ['member-040', 'Lâm Thu Su...', 'Tố Vấn', 'r_member', ''],
  ['member-041', 'Lilianna', 'Cửu Linh', 'r_member', ''],
  ['member-042', 'IlnLuv', 'Cửu Linh', 'r_member', ''],
  ['member-043', 'Tử Tịch', 'Tố Vấn', 'r_member', ''],
  ['member-044', 'Không Thiên...', 'Thiết Y', 'r_member', ''],
  ['member-045', 'MạnDu', 'Tố Vấn', 'r_member', ''],
  ['member-046', 'LạcNhiễmPh...', 'Cửu Linh', 'r_member', ''],
  ['member-047', 'HH  Gud Boiz', 'Long Ngâm', 'r_member', ''],
  ['member-048', 'Tây_Tây', 'Tố Vấn', 'r_member', ''],
  ['member-049', 'Vô Danh Thi...', 'Cửu Linh', 'r_member', ''],
  ['member-050', '夕阳西下', 'Toái Mộng', 'r_member', ''],
  ['member-051', 'Zhou Sva', 'Thần Tương', 'r_member', ''],
  ['member-052', 'Hứa Thất Anh', 'Huyết Hà', 'r_member', ''],
  ['member-053', 'TốHoànChân', 'Cửu Linh', 'r_member', ''],
  ['member-054', 'Lam Tịch Ni', 'Cửu Linh', 'r_member', ''],
  ['member-055', 'Cáo Sa Mạc', 'Thiết Y', 'r_member', ''],
  ['member-056', 'ĐộcCôCầuĐi...', 'Cửu Linh', 'r_member', ''],
  ['member-057', 'Phạt Em 1 ...', 'Thần Tương', 'r_member', ''],
  ['member-058', 'Bún Boà', 'Cửu Linh', 'r_member', ''],
  ['member-059', 'Bé Masha', 'Tố Vấn', 'r_member', ''],
  ['member-060', 'Nghiêm Tôn...', 'Huyết Hà', 'r_hoc_viec', ''],
  ['member-061', 'Young', 'Tố Vấn', 'r_hoc_viec', ''],
  ['member-062', 'Kiến Quỷ', 'Thiết Y', 'r_hoc_viec', ''],
  ['member-063', 'Tử Mộng', 'Toái Mộng', 'r_hoc_viec', ''],
  ['member-064', 'BấtQuy', 'Cửu Linh', 'r_hoc_viec', ''],
  ['member-065', 'Lnquynh', 'Cửu Linh', 'r_hoc_viec', ''],
  ['member-066', 'ThiênVân', 'Tố Vấn', 'r_hoc_viec', ''],
  ['member-067', 'Kỷ Phục Linh', 'Tố Vấn', 'r_hoc_viec', ''],
  ['member-068', 'Quân Hải Linh', 'Thiết Y', 'r_hoc_viec', ''],
  ['member-069', 'TuyếtHải', 'Thiết Y', 'r_hoc_viec', ''],
  ['member-070', 'Cừu Bông', 'Thần Tương', 'r_hoc_viec', ''],
  ['member-071', 'KNH', 'Thiết Y', 'r_hoc_viec', ''],
  ['member-072', 'AkiAki', 'Tố Vấn', 'r_hoc_viec', ''],
  ['member-073', 'Lâm Lôi', 'Long Ngâm', 'r_hoc_viec', ''],
  ['member-074', 'Yún Yue', 'Cửu Linh', 'r_hoc_viec', ''],
  ['member-075', 'Hổ chu Kính', 'Toái Mộng', 'r_nhi_duong_gia', '']
].map(([id, name, factionName, roleId, note]) => ({ id, name, factionId: factionIdByName(factionName), roleId, note }));

const assignment = (memberId, position, note = '', noteColor = DEFAULT_PT_NOTE_COLOR) => ({
  memberId, position, note, noteColor
});

const seed = {
  factions: clone(DEFAULT_FACTIONS),
  roles: [
    { id: 'r_member', name: 'Bang Chúng', locked: true },
    { id: 'r_lead', name: 'Lead', locked: true },
    { id: 'r_docnha_duong_chu', name: 'ĐộcNha Đường Chủ', locked: false },
    { id: 'r_tam_duong_gia', name: 'Tam Đương Gia', locked: false },
    { id: 'r_haclan_duong_chu', name: 'HắcLân Đường Chủ', locked: false },
    { id: 'r_haclan_pho_duong_chu', name: 'HắcLân Phó Đường Chủ', locked: false },
    { id: 'r_docnha_pho_duong_chu', name: 'ĐộcNha Phó Đường Chủ', locked: false },
    { id: 'r_hoc_viec', name: 'Học Việc', locked: false },
    { id: 'r_dai_duong_gia', name: 'Đại Đương Gia', locked: false },
    { id: 'r_tu_duong_gia', name: 'Tứ Đương Gia', locked: false },
    { id: 'r_ngu_duong_gia', name: 'Ngũ Đương Gia', locked: false },
    { id: 'r_tanhan_duong_chu', name: 'TàNhân Đường Chủ', locked: false },
    { id: 'r_quan_su', name: 'Quân Sư', locked: false },
    { id: 'r_nha_cong', name: 'Nhà Công', locked: false },
    { id: 'r_tanhan_duong_chung', name: 'TàNhân Đường Chúng', locked: false },
    { id: 'r_haclan_duong_chung', name: 'HắcLân Đường Chúng', locked: false }
    ,{ id: 'r_nhi_duong_gia', name: 'Nhị Đương Gia', locked: false }
  ],
  members: seedMembers,
  legions: [
    { id: 'l1', name: 'ĐOÀN 1 – DEF MID', type: 'DEF', parties: [
      { id: 'p11', name: 'PT1', note: '', members: [] },
      { id: 'p12', name: 'PT2', note: '', members: [] },
      { id: 'p13', name: 'PT3', note: '', members: [] },
      { id: 'p14', name: 'PT4', note: '', members: [] }
    ]},
    { id: 'l2', name: 'ĐOÀN 2 – ATK TRỤ', type: 'ATK', parties: [
      { id: 'p21', name: 'PT1', note: '', members: [] },
      { id: 'p22', name: 'PT2', note: '', members: [] },
      { id: 'p23', name: 'PT3', note: '', members: [] },
      { id: 'p24', name: 'PT4', note: '', members: [] }
    ]},
    { id: 'l3', name: 'ĐOÀN 3 – CƠ ĐỘNG', type: 'MOBILE', parties: [
      { id: 'p31', name: 'PT1', note: '', members: [] },
      { id: 'p32', name: 'PT2', note: '', members: [] }
    ]},
    { id: 'l4', name: 'ĐOÀN CÁNH', type: 'WING', parties: [
      { id: 'p41', name: 'PT1', note: '', members: [] },
      { id: 'p42', name: 'PT2', note: '', members: [] },
      { id: 'p43', name: 'PT3', note: '', members: [] },
      { id: 'p44', name: 'PT4', note: '', members: [] }
    ]}
  ],
  globalNotes: []
};

function normalizeNoteColor(color) {
  return validNoteColorIds.has(color) ? color : DEFAULT_PT_NOTE_COLOR;
}

function normalizeParty(party, seenMembers, validMemberIds) {
  party.note ||= '';
  party.members ||= [];
  const sortedLegacy = [...party.members].sort((a, b) => Number(a.position || 99) - Number(b.position || 99));
  const normalized = [];
  const usedPositions = new Set();
  for (const raw of sortedLegacy) {
    if (!validMemberIds.has(raw.memberId) || seenMembers.has(raw.memberId) || normalized.length >= PARTY_CAPACITY) continue;
    let position = Number(raw.position);
    if (!Number.isInteger(position) || position < 1 || position > PARTY_CAPACITY || usedPositions.has(position)) {
      position = Array.from({ length: PARTY_CAPACITY }, (_, i) => i + 1).find((candidate) => !usedPositions.has(candidate));
    }
    if (!position) continue;
    usedPositions.add(position);
    seenMembers.add(raw.memberId);
    normalized.push({
      memberId: raw.memberId,
      partyId: party.id,
      position,
      note: raw.note || '',
      noteColor: normalizeNoteColor(raw.noteColor)
    });
  }
  party.members = normalized;
  delete party.maxMembers;
}

function normalize(data) {
  data.factions = clone(DEFAULT_FACTIONS);
  data.roles ||= [];
  const roleNames = new Set(data.roles.map((r) => String(r.name).toLowerCase()));
  if (!roleNames.has('bang chúng')) data.roles.unshift({ id: 'r_member', name: 'Bang Chúng', locked: true });
  if (!roleNames.has('lead')) data.roles.push({ id: 'r_lead', name: 'Lead', locked: true });
  if (!data.roles.some((role) => role.id === 'r_dai_duong_gia')) data.roles.push({ id: 'r_dai_duong_gia', name: 'Đại Đương Gia', locked: false });
  if (!data.roles.some((role) => role.id === 'r_nhi_duong_gia')) data.roles.push({ id: 'r_nhi_duong_gia', name: 'Nhị Đương Gia', locked: false });
  data.roles = data.roles.map((role) => ({ ...role, locked: ['r_member','r_lead'].includes(role.id) ? true : Boolean(role.locked) }));

  data.members ||= [];
  const factionIds = new Set(data.factions.map((f) => f.id));
  data.members = data.members.map((member) => ({
    id: member.id || uid('m'),
    name: member.id === 'member-014' ? 'Xàranghae' : (member.id === 'member-070' ? 'Cừu Bông' : (member.id === 'member-075' ? 'Hổ chu Kính' : (member.name || 'Chưa đặt tên'))),
    factionId: member.id === 'member-075' ? 'toai-mong' : (factionIds.has(member.factionId) ? member.factionId : factionIdByName(member.className || member.class || '') || null),
    roleId: member.id === 'member-014' ? 'r_dai_duong_gia' : (member.id === 'member-075' ? 'r_nhi_duong_gia' : (data.roles.some((r) => r.id === member.roleId) ? member.roleId : (String(member.role || '').toLowerCase() === 'lead' ? 'r_lead' : 'r_member'))),
    note: member.note || ''
  }));
  if (!data.members.some((member) => member.id === 'member-075')) {
    data.members.push({ id: 'member-075', name: 'Hổ chu Kính', factionId: 'toai-mong', roleId: 'r_nhi_duong_gia', note: '' });
  }

  data.legions ||= [];
  if (!data.legions.some((legion) => legion.id === 'l4')) {
    data.legions.push(clone(seed.legions.find((legion) => legion.id === 'l4')));
  }
  const wingLegion = data.legions.find((legion) => legion.id === 'l4');
  if (wingLegion) {
    wingLegion.name = 'ĐOÀN CÁNH';
    wingLegion.type = 'WING';
  }
  const legionOrder = { l1: 1, l2: 2, l4: 3, l3: 4 };
  data.legions.sort((a, b) => (legionOrder[a.id] ?? 99) - (legionOrder[b.id] ?? 99));
  const validMemberIds = new Set(data.members.map((member) => member.id));
  const seenMembers = new Set();
  data.legions.forEach((legion) => {
    legion.parties ||= [];
    legion.parties.forEach((party) => normalizeParty(party, seenMembers, validMemberIds));
  });
  data.globalNotes ||= [];
  return data;
}

function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function load() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) { raw = legacy; break; }
    }
  }
  if (!raw) {
    const value = normalize(clone(seed));
    save(value);
    return value;
  }
  try {
    const value = normalize(JSON.parse(raw));
    save(value);
    return value;
  } catch {
    const value = normalize(clone(seed));
    save(value);
    return value;
  }
}


function findParty(data, partyId) {
  for (const legion of data.legions) {
    const party = legion.parties.find((item) => item.id === partyId);
    if (party) return { legion, party };
  }
  return null;
}

function findAssignment(data, memberId) {
  for (const legion of data.legions) {
    for (const party of legion.parties) {
      const assignment = party.members.find((item) => item.memberId === memberId);
      if (assignment) return { legion, party, assignment };
    }
  }
  return null;
}

function validatePosition(position) {
  const value = Number(position);
  if (!Number.isInteger(value) || value < 1 || value > PARTY_CAPACITY) throw new Error(`Position phải nằm trong khoảng 1-${PARTY_CAPACITY}.`);
  return value;
}

function validateFaction(data, factionId) {
  if (!data.factions.some((f) => f.id === factionId)) throw new Error('Phái không hợp lệ. Vui lòng chọn phái từ danh sách.');
}

function performSwap(data, memberAId, memberBId) {
  if (memberAId === memberBId) return;
  const a = findAssignment(data, memberAId);
  const b = findAssignment(data, memberBId);
  if (!a || !b) throw new Error('Không tìm thấy vị trí của thành viên cần SWAP.');
  const placementA = { partyId: a.party.id, position: a.assignment.position };
  const placementB = { partyId: b.party.id, position: b.assignment.position };
  a.party.members = a.party.members.filter((item) => item.memberId !== memberAId);
  b.party.members = b.party.members.filter((item) => item.memberId !== memberBId);
  Object.assign(a.assignment, placementB);
  Object.assign(b.assignment, placementA);
  b.party.members.push(a.assignment);
  a.party.members.push(b.assignment);
}

function performMove(data, { memberId, targetPartyId, targetPosition, note, noteColor }) {
  const source = findAssignment(data, memberId);
  const target = findParty(data, targetPartyId);
  if (!source || !target) throw new Error('Dữ liệu thành viên/PT không hợp lệ.');
  const position = validatePosition(targetPosition);
  const occupied = target.party.members.find((item) => item.memberId !== memberId && Number(item.position) === position);
  if (occupied) {
    performSwap(data, memberId, occupied.memberId);
    return { swappedWith: occupied.memberId };
  }
  if (source.party.id !== target.party.id && target.party.members.length >= PARTY_CAPACITY) throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);

  source.party.members = source.party.members.filter((item) => item.memberId !== memberId);
  source.assignment.partyId = target.party.id;
  source.assignment.position = position;
  if (note !== undefined) source.assignment.note = String(note).trim();
  if (noteColor !== undefined) source.assignment.noteColor = normalizeNoteColor(noteColor);
  target.party.members.push(source.assignment);
  return { swappedWith: null };
}

export const fakeApi = {
  async health() { await wait(20); return { status: 'ok', message: 'Guild Manager Mock API is running' }; },
  async getSnapshot() { await wait(); return clone(load()); },
  async getFactions() { await wait(20); return clone(load().factions); },

  async createMember(payload) {
    await wait(); const data = load(); validateFaction(data, payload.factionId);
    const name = String(payload.name || '').trim(); if (!name) throw new Error('Tên thành viên không được để trống.');
    const member = { id: uid('m'), name, factionId: payload.factionId, roleId: payload.roleId || 'r_member', note: String(payload.note || '').trim() };
    data.members.push(member); save(data); return clone(member);
  },

  async updateMember(id, payload) {
    await wait(); const data = load(); const member = data.members.find((item) => item.id === id); if (!member) throw new Error('Không tìm thấy thành viên.');
    validateFaction(data, payload.factionId); const name = String(payload.name || '').trim(); if (!name) throw new Error('Tên thành viên không được để trống.');
    Object.assign(member, { name, factionId: payload.factionId, roleId: payload.roleId || member.roleId, note: String(payload.note || '').trim() }); save(data); return clone(member);
  },

  async deleteMember(id) {
    await wait(); const data = load(); const member = data.members.find((item) => item.id === id); if (!member) return;
    data.legions.forEach((legion) => legion.parties.forEach((party) => { party.members = party.members.filter((item) => item.memberId !== id); }));
    data.members = data.members.filter((item) => item.id !== id); save(data);
  },

  async assignMember({ memberId, partyId, targetPosition, note = '', noteColor = DEFAULT_PT_NOTE_COLOR, forceMove = false }) {
    await wait(); const data = load(); const member = data.members.find((item) => item.id === memberId); const target = findParty(data, partyId);
    if (!member || !target) throw new Error('Dữ liệu thành viên/PT không hợp lệ.');
    const current = findAssignment(data, memberId);
    if (current && !forceMove) throw new Error('Thành viên đã có PT. Hãy dùng chức năng Chuyển PT.');
    if (target.party.members.length >= PARTY_CAPACITY && (!current || current.party.id !== target.party.id)) throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);
    if (current) current.party.members = current.party.members.filter((item) => item.memberId !== memberId);
    const position = targetPosition ? validatePosition(targetPosition) : firstEmptyPosition(target.party);
    if (!position) throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);
    if (target.party.members.some((item) => Number(item.position) === position)) throw new Error('Position đích đã có thành viên.');
    target.party.members.push({ memberId, partyId, position, note: String(note).trim(), noteColor: normalizeNoteColor(noteColor) }); save(data);
  },

  async moveMember({ memberId, partyId, targetPosition, note, noteColor }) {
    await wait(); const data = load(); const result = performMove(data, { memberId, targetPartyId: partyId, targetPosition, note, noteColor });
    const member = data.members.find((item) => item.id === memberId); save(data);
  },

  async movePartyMember({ memberId, targetPartyId, targetPosition }) {
    await wait(); const data = load(); const result = performMove(data, { memberId, targetPartyId, targetPosition }); save(data);
  },

  async swapPartyMembers({ memberAId, memberBId }) {
    await wait(); const data = load(); performSwap(data, memberAId, memberBId); save(data);
  },

  async updatePtNote({ memberId, note, noteColor }) {
    await wait(); const data = load(); const current = findAssignment(data, memberId); if (!current) throw new Error('Thành viên chưa có PT.');
    current.assignment.note = String(note || '').trim(); current.assignment.noteColor = normalizeNoteColor(noteColor); save(data);
  },

  async removeFromParty(memberId) {
    await wait(); const data = load(); const current = findAssignment(data, memberId); if (!current) return;
    current.party.members = current.party.members.filter((item) => item.memberId !== memberId); save(data);
  },

  async addParty(legionId) {
    await wait(); const data = load(); const legion = data.legions.find((item) => item.id === legionId); if (!legion) throw new Error('Không tìm thấy Đoàn.');
    const party = { id: uid('p'), name: `PT${legion.parties.length + 1}`, note: '', members: [] }; legion.parties.push(party); save(data); return clone(party);
  },

  async deleteParty(legionId, partyId) {
    await wait(); const data = load(); const legion = data.legions.find((item) => item.id === legionId); const party = legion?.parties.find((item) => item.id === partyId);
    if (!party) throw new Error('Không tìm thấy PT.'); if (party.members.length) throw new Error('Chỉ có thể xóa PT trống.');
    legion.parties = legion.parties.filter((item) => item.id !== partyId); save(data);
  },

  async saveGlobalNotes(notes) { await wait(); const data = load(); data.globalNotes = notes.map((item) => String(item).trim()).filter(Boolean); save(data); },

  async createRole(name) {
    await wait(); const data = load(); const clean = String(name || '').trim(); if (!clean) throw new Error('Tên chức vụ không được để trống.');
    if (data.roles.some((r) => r.name.toLowerCase() === clean.toLowerCase())) throw new Error('Chức vụ đã tồn tại.');
    data.roles.push({ id: uid('r'), name: clean, locked: false }); save(data);
  },

  async updateRole(id, name) {
    await wait(); const data = load(); const role = data.roles.find((item) => item.id === id); if (!role) throw new Error('Không tìm thấy chức vụ.');
    const clean = String(name || '').trim(); if (!clean) throw new Error('Tên chức vụ không được để trống.'); role.name = clean; save(data);
  },

  async deleteRole(id) {
    await wait(); const data = load(); const role = data.roles.find((item) => item.id === id); if (!role) return; if (role.locked) throw new Error('Không thể xóa chức vụ mặc định.');
    data.members.forEach((m) => { if (m.roleId === id) m.roleId = 'r_member'; }); data.roles = data.roles.filter((item) => item.id !== id); save(data);
  },

  async saveFormation() { await wait(); return { success: true }; },
  async resetDemo() { await wait(); const data = normalize(clone(seed)); save(data); }
};
