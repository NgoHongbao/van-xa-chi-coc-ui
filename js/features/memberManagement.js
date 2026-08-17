import { escapeHtml as e } from '../utils/text.js';
import { openModal, closeModal } from '../components/modal.js';

const byId = (items, id) => items.find((item) => item.id === id);

export async function openMemberForm({ modalRoot, snapshot, memberId = null, findAssignment, api, refresh, toast }) {
  const member = memberId ? byId(snapshot.members, memberId) : null;
  const current = member ? findAssignment(member.id) : null;

  let factions = snapshot.factions || [];
  try {
    factions = await api.getFactions();
  } catch (error) {
    if (!factions.length) return toast(error.message || 'Không tải được danh sách phái.', 'error');
  }

  openModal(modalRoot, {
    title: member ? 'Chỉnh sửa thành viên' : 'Thêm thành viên',
    subtitle: 'Phái được lấy từ database; member chỉ lưu factionId.',
    body: `
      <div class="form-grid">
        <label class="field full"><span>Tên thành viên</span><input id="member-name" value="${e(member?.name || '')}" placeholder="VD: Bae Hera" /></label>
        <label class="field"><span>Phái</span><select id="member-faction">
          <option value="">Chọn phái</option>
          ${factions.map((faction) => `<option value="${e(faction.id)}" ${member?.factionId === faction.id ? 'selected' : ''}>${e(faction.name)}</option>`).join('')}
        </select></label>
        <label class="field"><span>Chức vụ</span><select id="member-role">${snapshot.roles.map((role) => `<option value="${role.id}" ${member?.roleId === role.id || (!member && role.id === 'r_member') ? 'selected' : ''}>${e(role.name)}</option>`).join('')}</select></label>
        <label class="field full"><span>Note cá nhân <small>· thuộc về member, không phải PT Note</small></span><textarea id="member-note" rows="4" placeholder="VD: Thường dùng Tướng Bảng + TCD">${e(member?.note || '')}</textarea></label>
      </div>
      ${member ? `<div class="current-pt-panel">${current ? `PT hiện tại: <strong>${e(current.legion.name)} / ${e(current.party.name)} / Position #${current.assignment.position}</strong>` : 'PT hiện tại: <strong>Chưa xếp PT</strong>'}</div>` : ''}
    `,
    footer: `<button class="btn secondary" data-close-modal>Hủy</button><button class="btn primary" id="save-member">${member ? 'Lưu thay đổi' : 'Thêm thành viên'}</button>`
  });

  modalRoot.querySelector('#save-member').addEventListener('click', async () => {
    const payload = {
      name: modalRoot.querySelector('#member-name').value,
      factionId: modalRoot.querySelector('#member-faction').value,
      roleId: modalRoot.querySelector('#member-role').value,
      note: modalRoot.querySelector('#member-note').value
    };
    if (!payload.name.trim() || !payload.factionId) return toast('Vui lòng nhập Tên và chọn Phái.', 'error');

    try {
      if (member) await api.updateMember(member.id, payload);
      else await api.createMember(payload);
      closeModal(modalRoot);
      await refresh();
      toast(member ? 'Đã cập nhật thành viên.' : 'Đã thêm thành viên mới.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export function openRoleModal({ modalRoot, snapshot, roleId = null, api, refresh, toast }) {
  const role = roleId ? byId(snapshot.roles, roleId) : null;
  openModal(modalRoot, {
    title: role ? 'Đổi tên chức vụ' : 'Thêm chức vụ',
    subtitle: 'Chức vụ là vị trí trong bang, không phải role chiến đấu.',
    body: `<label class="field"><span>Tên chức vụ</span><input id="role-name" value="${e(role?.name || '')}" placeholder="VD: Đại Đương Gia" /></label>`,
    footer: `<button class="btn secondary" data-close-modal>Hủy</button><button class="btn primary" id="save-role">${role ? 'Lưu thay đổi' : 'Thêm chức vụ'}</button>`
  });

  modalRoot.querySelector('#save-role').addEventListener('click', async () => {
    const name = modalRoot.querySelector('#role-name').value;
    try {
      if (role) await api.updateRole(role.id, name);
      else await api.createRole(name);
      closeModal(modalRoot);
      await refresh();
      toast(role ? 'Đã đổi tên chức vụ.' : 'Đã thêm chức vụ.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

export function confirmDeleteMember({ modalRoot, snapshot, memberId, api, refresh, toast }) {
  const member = byId(snapshot.members, memberId);
  if (!member) return;

  openModal(modalRoot, {
    title: 'Xóa thành viên?',
    subtitle: 'Thao tác này cũng gỡ thành viên khỏi PT hiện tại.',
    body: `<div class="confirm-copy">Bạn có chắc muốn xóa <strong>${e(member.name)}</strong> khỏi database thành viên?</div>`,
    footer: '<button class="btn secondary" data-close-modal>Hủy</button><button class="btn danger-btn" id="confirm-delete">Xóa thành viên</button>'
  });

  modalRoot.querySelector('#confirm-delete').addEventListener('click', async () => {
    try {
      await api.deleteMember(memberId);
      closeModal(modalRoot);
      await refresh();
      toast('Đã xóa thành viên.');
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}
