import { PARTY_CAPACITY, PT_NOTE_COLORS, DEFAULT_PT_NOTE_COLOR } from '../constants.js';
import { escapeHtml as e } from '../utils/text.js';
import { avatarContent } from '../utils/avatar.js?v=20260817-avatar25';
import { openModal, closeModal, selectOptions } from '../components/modal.js';
import { firstEmptyPosition } from '../state/formation.js';

const byId = (items, id) => items.find((item) => item.id === id);

function noteColorOptions(selected = DEFAULT_PT_NOTE_COLOR) {
  return PT_NOTE_COLORS.map((item) => `<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${e(item.label)}</option>`).join('');
}

export function openAssignModal({ modalRoot, snapshot, defaults = {}, findAssignment, factionName, api, refresh, toast }) {
  const firstLegion = byId(snapshot.legions, defaults.legionId) || snapshot.legions[0];
  const firstParty = byId(firstLegion.parties, defaults.partyId) || firstLegion.parties[0];
  const unassigned = snapshot.members.filter((member) => !findAssignment(member.id));
  const factions = snapshot.factions || [];

  const renderMemberOptions = (members) => members.length
    ? members.map((member) => `<option value="${member.id}">${e(member.name)} · ${e(factionName(member))}</option>`).join('')
    : '<option value="">Không có thành viên phù hợp</option>';

  const renderFactionOptions = () => [
    '<option value="">Tất cả phái</option>',
    ...factions.map((faction) => `<option value="${e(faction.id)}">${e(faction.name)}</option>`)
  ].join('');

  openModal(modalRoot, {
    title: 'Thêm thành viên vào PT',
    subtitle: `Lọc theo Phái rồi chọn thành viên chưa có PT. Mỗi PT chứa tối đa ${PARTY_CAPACITY} thành viên, position 1–${PARTY_CAPACITY}.`,
    body: `
      <div class="form-grid">
        <label class="field"><span>Lọc theo Phái</span><select id="assign-faction">${renderFactionOptions()}</select></label>
        <div class="field"><span>Kết quả</span><div class="current-pt-panel compact" id="assign-member-count">${unassigned.length} thành viên chưa có PT</div></div>
        <label class="field full"><span>Thành viên</span><select id="assign-member">${renderMemberOptions(unassigned)}</select></label>
        <label class="field"><span>Đoàn</span><select id="assign-legion">${selectOptions(snapshot.legions, firstLegion.id, (item) => item.name)}</select></label>
        <label class="field"><span>PT</span><select id="assign-party">${selectOptions(firstLegion.parties, firstParty.id, (item) => `${item.name} · ${item.members.length}/${PARTY_CAPACITY}`)}</select></label>
        <label class="field full"><span>PT Note <small>· đi theo member khi MOVE/SWAP</small></span><input id="assign-note" placeholder="VD: LEAD, Nói dây, POC..." /></label>
        <label class="field"><span>Màu PT Note</span><select id="assign-note-color">${noteColorOptions()}</select></label>
        <div class="field"><span>Vị trí</span><div class="current-pt-panel" id="assign-position-preview">Tự động chọn position trống đầu tiên.</div></div>
      </div>
    `,
    footer: '<button class="btn secondary" data-close-modal>Hủy</button><button class="btn primary" id="submit-assign">Thêm vào PT</button>'
  });

  const factionSelect = modalRoot.querySelector('#assign-faction');
  const memberSelect = modalRoot.querySelector('#assign-member');
  const memberCount = modalRoot.querySelector('#assign-member-count');
  const legionSelect = modalRoot.querySelector('#assign-legion');
  const partySelect = modalRoot.querySelector('#assign-party');
  const preview = modalRoot.querySelector('#assign-position-preview');

  function applyFactionFilter() {
    const factionId = factionSelect.value;
    const filtered = unassigned.filter((member) => !factionId || member.factionId === factionId);
    memberSelect.innerHTML = renderMemberOptions(filtered);
    memberCount.textContent = `${filtered.length} thành viên chưa có PT`;
  }

  function updatePositionPreview() {
    const legion = byId(snapshot.legions, legionSelect.value);
    const party = byId(legion?.parties || [], partySelect.value);
    const position = party ? firstEmptyPosition(party) : null;
    preview.textContent = position ? `Position sẽ dùng: #${position}` : `PT đã đủ ${PARTY_CAPACITY} thành viên.`;
  }

  factionSelect.addEventListener('change', applyFactionFilter);
  legionSelect.addEventListener('change', () => {
    const legion = byId(snapshot.legions, legionSelect.value);
    partySelect.innerHTML = selectOptions(legion.parties, legion.parties[0]?.id, (item) => `${item.name} · ${item.members.length}/${PARTY_CAPACITY}`);
    updatePositionPreview();
  });
  partySelect.addEventListener('change', updatePositionPreview);
  applyFactionFilter();
  updatePositionPreview();

  modalRoot.querySelector('#submit-assign').addEventListener('click', async () => {
    try {
      if (!memberSelect.value) throw new Error('Không có thành viên phù hợp để thêm vào PT.');
      const legion = byId(snapshot.legions, legionSelect.value);
      const party = byId(legion?.parties || [], partySelect.value);
      if (!party) throw new Error('Không tìm thấy PT đích.');
      const position = firstEmptyPosition(party);
      if (position === null || party.members.length >= PARTY_CAPACITY) throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);

      await api.assignMember({
        memberId: memberSelect.value,
        partyId: party.id,
        targetPosition: position,
        note: modalRoot.querySelector('#assign-note').value,
        noteColor: modalRoot.querySelector('#assign-note-color').value,
        forceMove: false
      });
      closeModal(modalRoot);
      await refresh();
      toast('Đã thêm thành viên vào PT.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export function openMoveModal({ modalRoot, snapshot, memberId, findAssignment, factionName, roleName, api, refresh, toast }) {
  const member = byId(snapshot.members, memberId);
  if (!member) return;
  const current = findAssignment(memberId);
  const firstLegion = current?.legion || snapshot.legions[0];
  const firstParty = current?.party || firstLegion.parties[0];
  const note = current?.assignment.note || '';
  const noteColor = current?.assignment.noteColor || DEFAULT_PT_NOTE_COLOR;

  openModal(modalRoot, {
    title: 'Chuyển PT / sửa PT Note',
    subtitle: current ? `Hiện tại: ${current.legion.name} / ${current.party.name} / Position #${current.assignment.position}` : 'Thành viên này hiện chưa được xếp PT.',
    body: `
      <div class="member-summary"><div class="member-avatar large">${avatarContent(member)}</div><div><strong>${e(member.name)}</strong><span>${e(factionName(member))} · ${e(roleName(member.roleId))}</span></div></div>
      <div class="form-grid">
        <label class="field"><span>Đoàn</span><select id="move-legion">${selectOptions(snapshot.legions, firstLegion.id, (item) => item.name)}</select></label>
        <label class="field"><span>PT</span><select id="move-party">${selectOptions(firstLegion.parties, firstParty.id, (item) => `${item.name} · ${item.members.length}/${PARTY_CAPACITY}`)}</select></label>
        <label class="field full"><span>PT Note</span><input id="move-note" value="${e(note)}" placeholder="VD: LEAD, Nói dây, POC..." /></label>
        <label class="field"><span>Màu PT Note</span><select id="move-note-color">${noteColorOptions(noteColor)}</select></label>
        <div class="field"><span>Position</span><div class="current-pt-panel" id="move-position-preview"></div></div>
      </div>
      ${current ? '<div class="inline-warning"><strong>Gỡ khỏi PT</strong><p>Member Note vẫn được giữ nguyên.</p><button class="btn small danger-btn" id="remove-party">Gỡ khỏi PT hiện tại</button></div>' : ''}
    `,
    footer: '<button class="btn secondary" data-close-modal>Hủy</button><button class="btn primary" id="submit-move">Lưu vị trí</button>'
  });

  const legionSelect = modalRoot.querySelector('#move-legion');
  const partySelect = modalRoot.querySelector('#move-party');
  const preview = modalRoot.querySelector('#move-position-preview');

  function updatePreview() {
    const legion = byId(snapshot.legions, legionSelect.value);
    const party = byId(legion?.parties || [], partySelect.value);
    if (!party) return;
    if (current && current.party.id === party.id) preview.textContent = `Giữ Position hiện tại #${current.assignment.position}.`;
    else {
      const position = firstEmptyPosition(party);
      preview.textContent = position ? `Position trống đầu tiên: #${position}` : `PT đã đủ ${PARTY_CAPACITY} thành viên.`;
    }
  }

  legionSelect.addEventListener('change', () => {
    const legion = byId(snapshot.legions, legionSelect.value);
    partySelect.innerHTML = selectOptions(legion.parties, legion.parties[0]?.id, (item) => `${item.name} · ${item.members.length}/${PARTY_CAPACITY}`);
    updatePreview();
  });
  partySelect.addEventListener('change', updatePreview);
  updatePreview();

  modalRoot.querySelector('#submit-move').addEventListener('click', async () => {
    try {
      const targetPartyId = partySelect.value;
      const targetLegion = snapshot.legions.find((legion) => legion.parties.some((party) => party.id === targetPartyId));
      const targetParty = targetLegion?.parties.find((party) => party.id === targetPartyId);
      if (!targetParty) throw new Error('Không tìm thấy PT đích.');

      const sameParty = current && current.party.id === targetPartyId;
      if (!sameParty && targetParty.members.length >= PARTY_CAPACITY) throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);
      const targetPosition = sameParty ? current.assignment.position : firstEmptyPosition(targetParty);
      if (targetPosition === null) throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);

      const payload = {
        memberId,
        partyId: targetPartyId,
        targetPosition,
        note: modalRoot.querySelector('#move-note').value,
        noteColor: modalRoot.querySelector('#move-note-color').value
      };
      if (current) await api.moveMember(payload);
      else await api.assignMember({ ...payload, forceMove: false });

      closeModal(modalRoot);
      await refresh();
      toast(current ? 'Đã cập nhật PT/Position.' : 'Đã xếp PT cho thành viên.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  modalRoot.querySelector('#remove-party')?.addEventListener('click', async () => {
    try {
      await api.removeFromParty(memberId);
      closeModal(modalRoot);
      await refresh();
      toast('Đã gỡ thành viên khỏi PT.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}
