import { api, API_MODE } from './api.js?v=20261121-login-compat';
import { PARTY_CAPACITY } from './constants.js';
import { assignmentAt } from './state/formation.js';
import { escapeHtml as e, initials } from './utils/text.js?v=20261121-login-compat';
import { avatarContent, memberAvatarSrc } from './utils/avatar.js?v=20260817-webp1';
import { bindDragDrop } from './features/dragDrop.js';
import { captureFullOverview, captureLegion } from './features/screenshot.js?v=20261128-capture-colors';
import { openAssignModal, openMoveModal } from './features/partyManagement.js';
import { openMemberForm, openRoleModal, confirmDeleteMember } from './features/memberManagement.js';
import { openModal, closeModal } from './components/modal.js';
import { bindSidebarToggle } from './features/sidebar.js?v=20261121-login-compat';
import { initTheme, getTheme, setTheme, toggleTheme, updateThemeToggle, getAccent, setAccent } from './features/theme.js?v=20261121-christmas-theme';
import { login, saveAuth, clearAuth, clearRememberedAuth, getAuthToken, getAuthUser } from './auth.js?v=20261121-login-compat';

const root = document.querySelector('#page-root');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
const navItems = [...document.querySelectorAll('.nav-item')];
const appShell = document.querySelector('.app-shell');
const sidebarToggle = document.querySelector('#sidebar-toggle');
const themeQuickToggle = document.querySelector('#theme-quick-toggle');
const brandAvatar = document.querySelector('#brand-avatar');
const sidebarBanner = document.querySelector('#sidebar-banner');
const loginScreen = document.querySelector('#login-screen');
const loginForm = document.querySelector('#login-form');
bindSidebarToggle({ shell: appShell, button: sidebarToggle });
initTheme();
updateThemeToggle(themeQuickToggle);
brandAvatar?.addEventListener('click', () => {
  openModal(modalRoot, {
    title: 'Vạn Xà Chi Cốc',
    subtitle: 'Avatar Guild Manager',
    wide: true,
    body: '<div class="brand-avatar-view"><img src="assets/avatars/guild-manager.webp" alt="Vạn Xà Chi Cốc"></div>'
  });
});
sidebarBanner?.addEventListener('click', () => {
  openModal(modalRoot, {
    title: 'Vạn Xà Chi Cốc',
    subtitle: 'Ảnh bang hội',
    wide: true,
    body: '<div class="guild-banner-view"><img src="assets/banners/van-xa-chi-coc-original.webp" alt="Vạn Xà Chi Cốc"></div>'
  });
});
themeQuickToggle?.addEventListener('click', () => {
  toggleTheme();
  updateThemeToggle(themeQuickToggle);
  if (state.snapshot) renderPage();
});

const state = {
  snapshot: null,
  page: 'overview',
  memberSearch: '',
  memberFaction: '',
  memberRole: '',
  memberPt: '',
  memberPoolFaction: '',
  memberPoolPt: '',
  memberPoolSearch: '',
  busy: false
};

const byId = (items, id) => items.find((item) => item.id === id);

function roleName(roleId) {
  return byId(state.snapshot.roles, roleId)?.name || 'Bang Chúng';
}

function memberById(id) {
  return byId(state.snapshot.members, id);
}

function factionById(id) {
  return byId(state.snapshot.factions || [], id);
}

function factionName(member) {
  return factionById(member?.factionId)?.name || 'Chưa chọn phái';
}

function factionColor(member) {
  const color = factionById(member?.factionId)?.color || '#64748b';
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#64748b';
}

function factionPastelColor(member) {
  const color = factionColor(member);
  const channels = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
  const base = [255, 249, 252];
  const amount = .11;
  return `rgb(${base.map((channel, index) => Math.round(channel * (1 - amount) + channels[index] * amount)).join(', ')})`;
}

function findAssignment(memberId) {
  for (const legion of state.snapshot.legions) {
    for (const party of legion.parties) {
      const assignment = party.members.find((a) => a.memberId === memberId);
      if (assignment) return { legion, party, assignment };
    }
  }
  return null;
}

function typeLabel(type) {
  return type === 'DEF' ? 'DEF' : ['ATK', 'WING'].includes(type) ? 'ATK' : 'CƠ ĐỘNG';
}

function toast(message, kind = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span>${kind === 'success' ? '✓' : kind === 'error' ? '!' : 'i'}</span><div>${e(message)}</div>`;
  toastRoot.append(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 220);
  }, 3000);
}

async function refresh({ render = true } = {}) {
  state.snapshot = await api.getSnapshot();
  if (render) renderPage();
}

function setPage(page) {
  state.page = page;
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.page === page));
  renderPage();
  const scroller = matchMedia('(max-width: 760px)').matches ? window : document.querySelector('.main-content');
  scroller?.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => item.addEventListener('click', () => setPage(item.dataset.page)));

function pageHeader(title, description, actions = '') {
  return `
    <header class="page-header">
      <div>
        <h1>${e(title)}</h1>
        <p>${e(description)}</p>
      </div>
      <div class="header-actions">${actions}</div>
    </header>
  `;
}

function renderPage() {
  if (!state.snapshot) return;
  const pages = {
    overview: renderOverview,
    members: renderMembers,
    formations: renderFormations,
    notes: renderNotes,
    settings: renderSettings
  };
  root.innerHTML = pages[state.page]();
  bindCurrentPage();
}

function captureViewportState() {
  const main = document.querySelector('.main-content');
  const pool = root.querySelector('#member-pool-list');
  return {
    mainTop: main?.scrollTop || 0,
    mainLeft: main?.scrollLeft || 0,
    poolTop: pool?.scrollTop || 0,
    poolLeft: pool?.scrollLeft || 0
  };
}

function renderPagePreservingViewport() {
  const viewport = captureViewportState();
  renderPage();

  // Restore synchronously in the same task so the browser does not paint a
  // frame with scrollTop = 0 between Drag & Drop state updates.
  const main = document.querySelector('.main-content');
  const pool = root.querySelector('#member-pool-list');
  if (main) {
    main.scrollTop = viewport.mainTop;
    main.scrollLeft = viewport.mainLeft;
  }
  if (pool) {
    pool.scrollTop = viewport.poolTop;
    pool.scrollLeft = viewport.poolLeft;
  }
}

function overviewActions() {
  return `
    <button class="btn secondary" data-action="capture-page" title="Chụp toàn bộ trang Tổng quan">
      <span class="btn-icon">▣</span> Chụp trang
    </button>
    <button class="btn primary" data-action="open-assign"><span class="btn-icon">＋</span> Thêm thành viên</button>
  `;
}

function renderOverview() {
  return `
    <section class="page overview-page" id="capture-surface">
      <header class="page-header overview-actions-only"><div class="header-actions">${overviewActions()}</div></header>

      <div class="overview-layout">
        <section class="legion-stack">
          <div class="section-heading compact-heading">
            <div>
              <span class="section-kicker">ĐỘI HÌNH HIỆN TẠI</span>
              <h2>Danh sách đoàn</h2>
            </div>
            <span class="muted-text">PT tối đa ${PARTY_CAPACITY} người · Position 1–${PARTY_CAPACITY}</span>
          </div>
          ${state.snapshot.legions.map(renderLegion).join('')}
        </section>

        <aside class="overview-side-column">
          <section class="global-note-card">
            <div class="note-card-head">
              <div>
                <span class="section-kicker">GLOBAL NOTE</span>
                <h3>Ghi chú chung</h3>
              </div>
              <button class="icon-btn" data-page-link="notes" title="Mở ghi chú chung">✎</button>
            </div>
            <div class="note-list compact">
              ${state.snapshot.globalNotes.slice(0, 6).map((note) => `<div class="note-line"><span>•</span><p>${e(note)}</p></div>`).join('') || '<p class="empty-copy">Chưa có ghi chú chung.</p>'}
            </div>
          </section>
          ${renderMemberPool()}
        </aside>
      </div>
    </section>
  `;
}

function renderMemberPool() {
  const members = state.snapshot.members || [];
  const factions = state.snapshot.factions || [];
  const selectedFaction = factions.find((faction) => faction.id === state.memberPoolFaction);
  const selectedFactionColor = /^#[0-9a-f]{6}$/i.test(selectedFaction?.color || '') ? selectedFaction.color : '';
  return `
    <section class="member-pool-card">
      <div class="member-pool-head">
        <div>
          <span class="section-kicker">THÀNH VIÊN</span>
          <h3>Danh sách thành viên</h3>
          <p>Kéo member vào ô trống của PT. Member đã có PT vẫn có thể kéo để MOVE/SWAP.</p>
        </div>
        <span class="member-pool-count" id="member-pool-count">${members.length}</span>
      </div>
      <div class="member-pool-search">
        <span aria-hidden="true">⌕</span>
        <input id="member-pool-search" type="text" placeholder="Tìm thành viên..." value="${e(state.memberPoolSearch)}" autocomplete="off" aria-label="Tìm thành viên">
      </div>
      <div class="member-pool-filter-row">
      <label class="member-pool-filter">
        <span>Phái</span>
        <span class="member-pool-select-shell ${selectedFactionColor ? 'has-faction' : ''}" ${selectedFactionColor ? `style="--faction-filter-color:${selectedFactionColor}"` : ''}>
          <select id="member-pool-faction" aria-label="Lọc thành viên theo phái">
            <option value="">Tất cả các phái</option>
            ${factions.map((faction) => {
              const color = /^#[0-9a-f]{6}$/i.test(faction.color || '') ? faction.color : '#cbd5e1';
              return `<option value="${e(faction.id)}" data-faction-color="${color}" style="color:${color}" ${state.memberPoolFaction === faction.id ? 'selected' : ''}>${e(faction.name)}</option>`;
            }).join('')}
          </select>
          <i aria-hidden="true"></i>
        </span>
      </label>
      <label class="member-pool-filter member-pool-pt-filter">
        <span>PT</span>
        <span class="member-pool-select-shell">
          <select id="member-pool-pt" aria-label="Lọc thành viên theo trạng thái PT">
            <option value="">Tất cả thành viên</option>
            <option value="unassigned" ${state.memberPoolPt === 'unassigned' ? 'selected' : ''}>Chưa kéo vào PT</option>
            <option value="assigned" ${state.memberPoolPt === 'assigned' ? 'selected' : ''}>Đã có PT</option>
          </select>
          <i aria-hidden="true"></i>
        </span>
      </label>
      </div>
      <div class="member-pool-list" id="member-pool-list">
        ${members.map(renderMemberPoolItem).join('')}
        <div class="member-pool-empty hidden" id="member-pool-empty">Không có thành viên thuộc phái này.</div>
      </div>
    </section>
  `;
}

function renderMemberPoolItem(member) {
  const location = findAssignment(member.id);
  const color = factionColor(member);
  const locationText = location ? `${location.legion.name} · ${location.party.name} #${location.assignment.position}` : 'Chưa xếp PT';
  return `
    <div class="member-pool-item faction-themed" style="--faction-color:${color};--faction-pastel-color:${factionPastelColor(member)}" draggable="true" data-member-pool-item data-member-id="${member.id}" data-member-name="${e(member.name.toLocaleLowerCase('vi'))}" data-faction-id="${e(member.factionId || '')}" data-pt-status="${location ? 'assigned' : 'unassigned'}">
      <span class="member-pool-grip" title="Kéo vào PT">⋮⋮</span>
      <button type="button" class="member-avatar avatar-preview-button" data-action="view-member-avatar" data-member-id="${e(member.id)}" title="Xem avatar ${e(member.name)}">${avatarContent(member)}</button>
      <div class="member-pool-main">
        <strong title="${e(member.name)}">${e(member.name)}</strong>
        <small class="${location ? 'assigned' : 'unassigned'}">${e(locationText)}</small>
      </div>
    </div>
  `;
}

function applyMemberPoolFilter() {
  const filter = state.memberPoolFaction;
  const ptFilter = state.memberPoolPt;
  const query = state.memberPoolSearch.trim().toLocaleLowerCase('vi');
  const select = root.querySelector('#member-pool-faction');
  const selectShell = select?.closest('.member-pool-select-shell');
  const selectedColor = select?.selectedOptions?.[0]?.dataset.factionColor || '';
  if (selectShell) {
    selectShell.classList.toggle('has-faction', Boolean(selectedColor));
    if (selectedColor) selectShell.style.setProperty('--faction-filter-color', selectedColor);
    else selectShell.style.removeProperty('--faction-filter-color');
  }
  const items = [...root.querySelectorAll('[data-member-pool-item]')];
  let visible = 0;

  items.forEach((item) => {
    const matchesFaction = !filter || item.dataset.factionId === filter;
    const matchesPt = !ptFilter || item.dataset.ptStatus === ptFilter;
    const matchesSearch = !query || (item.dataset.memberName || '').includes(query);
    const show = matchesFaction && matchesPt && matchesSearch;

    // Use the native hidden attribute as the source of truth.
    // The previous implementation only toggled .hidden, which could be
    // overridden by .member-pool-item { display: grid } later in the CSS.
    item.hidden = !show;
    item.classList.toggle('hidden', !show);

    if (show) visible += 1;
  });

  const count = root.querySelector('#member-pool-count');
  if (count) {
    count.textContent = filter || ptFilter || query ? `${visible}/${items.length}` : String(visible);
    count.title = filter || query ? `Đang hiển thị ${visible} trên ${items.length} thành viên` : `${visible} thành viên`;
  }

  const emptyState = root.querySelector('#member-pool-empty');
  if (emptyState) {
    emptyState.hidden = visible !== 0;
    emptyState.classList.toggle('hidden', visible !== 0);
  }
}

function renderLegion(legion) {
  const total = legion.parties.reduce((sum, party) => sum + party.members.length, 0);
  const capacity = legion.parties.length * PARTY_CAPACITY;
  return `
    <article class="legion-card ${legion.type.toLowerCase()}" data-legion-id="${legion.id}">
      <div class="legion-header">
        <div class="legion-title-wrap">
          <span class="legion-accent"></span>
          <div>
            <div class="legion-title-row">
              <h3>${e(legion.name)}</h3>
              <span class="type-badge">${typeLabel(legion.type)}</span>
            </div>
            <p>${legion.parties.length} PT · ${total}/${capacity} thành viên</p>
          </div>
        </div>
        <div class="legion-header-actions">
          <button class="btn small secondary legion-capture-btn" data-action="capture-legion" data-legion-id="${legion.id}" title="Chụp riêng ${e(legion.name)}">▣ Chụp Đoàn</button>
          <div class="legion-capacity"><span>${total}</span><small>/ ${capacity}</small></div>
        </div>
      </div>
      <div class="party-grid">
        ${legion.parties.map((party) => renderParty(legion, party)).join('')}
      </div>
    </article>
  `;
}

function renderParty(legion, party) {
  const total = party.members.length;
  const missing = PARTY_CAPACITY - total;
  const factionSummary = renderPartyFactionSummary(party);
  const firstEmpty = Array.from({ length: PARTY_CAPACITY }, (_, index) => index + 1)
    .find((position) => !assignmentAt(party, position));
  const slots = Array.from({ length: PARTY_CAPACITY }, (_, index) => {
    const position = index + 1;
    const assignment = assignmentAt(party, position);
    if (assignment) return renderMemberSlot(legion, party, position, assignment);
    const actionable = total < PARTY_CAPACITY && position === firstEmpty;
    return actionable
      ? `<button class="empty-slot actionable drop-slot" data-drop-slot data-party-id="${party.id}" data-position="${position}" data-action="open-assign" data-legion-id="${legion.id}"><span>＋</span> Thêm thành viên <small>#${position}</small></button>`
      : `<div class="empty-slot drop-slot" data-drop-slot data-party-id="${party.id}" data-position="${position}"><span>—</span><small>Trống · #${position}</small></div>`;
  }).join('');

  return `
    <section class="party-card ${total === PARTY_CAPACITY ? 'full' : 'incomplete'}" data-party-id="${party.id}">
      <div class="party-header">
        <div>
          <div class="party-title-row"><h4>${e(party.name)}</h4><span class="capacity-pill">${total} / ${PARTY_CAPACITY}</span></div>
          <div class="party-status ${total === PARTY_CAPACITY ? 'ok' : ''}">${total === PARTY_CAPACITY ? 'Đã đủ đội hình' : `Còn thiếu ${missing} người`}</div>
        </div>
        <button class="mini-add" data-action="open-assign" data-legion-id="${legion.id}" data-party-id="${party.id}" ${total >= PARTY_CAPACITY ? `disabled title="PT đã đủ ${PARTY_CAPACITY} thành viên"` : ''}>${total >= PARTY_CAPACITY ? 'Đủ 6/6' : '＋ Thêm'}</button>
        <div class="party-faction-summary" aria-label="Thành phần phái trong ${e(party.name)}">${factionSummary}</div>
      </div>
      <div class="member-slot-list party-slot-list">${slots}</div>
    </section>
  `;
}

function renderPartyFactionSummary(party) {
  const abbreviations = {
    'huyet-ha': 'HH',
    'than-tuong': 'TT',
    'toai-mong': 'TM',
    'thiet-y': 'TY',
    'to-van': 'TV',
    'long-ngam': 'LN',
    'cuu-linh': 'CL',
    'huyen-co': 'HC'
  };
  const counts = new Map();
  for (const assignment of party.members || []) {
    const member = memberById(assignment.memberId);
    if (member?.factionId) counts.set(member.factionId, (counts.get(member.factionId) || 0) + 1);
  }
  const items = (state.snapshot.factions || []).filter((faction) => counts.has(faction.id));
  if (!items.length) return '<span class="party-faction-empty">Chưa có thành viên</span>';
  return items.map((faction) => {
    const color = /^#[0-9a-f]{6}$/i.test(faction.color || '') ? faction.color : '#64748b';
    const abbreviation = abbreviations[faction.id] || faction.name.slice(0, 2).toLocaleUpperCase('vi');
    return `<span class="party-faction-count" style="--faction-summary-color:${color}" title="${counts.get(faction.id)} ${e(faction.name)}"><b>${counts.get(faction.id)}</b>${e(abbreviation)}</span>`;
  }).join('');
}

function renderMemberSlot(legion, party, position, assignment) {
  const member = memberById(assignment.memberId);
  if (!member) return '';
  const lead = roleName(member.roleId).toLowerCase() === 'lead';
  const color = factionColor(member);
  const noteColor = assignment.noteColor || 'purple';
  return `
    <div class="member-slot drop-slot faction-themed" style="--faction-color:${color};--faction-pastel-color:${factionPastelColor(member)}" draggable="true" data-drop-slot data-member-id="${member.id}" data-legion-id="${legion.id}" data-party-id="${party.id}" data-position="${position}" title="Kéo để đổi vị trí · Nhấp đúp để gỡ khỏi PT">
      <div class="drag-handle" title="Kéo để MOVE / SWAP / REORDER">⋮⋮</div>
      <button type="button" class="member-avatar avatar-preview-button ${lead ? 'lead' : ''}" data-action="view-member-avatar" data-member-id="${e(member.id)}" title="Xem avatar ${e(member.name)}">${avatarContent(member)}</button>
      <div class="member-slot-main">
        <div class="member-name-line">
          <strong title="${e(member.name)}">${e(member.name)}</strong>
          ${lead ? '<span class="lead-badge">LEAD</span>' : ''}
        </div>
        <span class="member-class"><i class="faction-dot"></i>${e(factionName(member))} · ${e(roleName(member.roleId))}</span>
        ${assignment.note ? `<span class="pt-note note-${e(noteColor)}" title="PT Note">${e(assignment.note)}</span>` : '<span class="pt-note muted">Chưa có PT Note</span>'}
      </div>
      <span class="slot-position" title="Position">#${position}</span>
      <button class="slot-menu" data-action="open-move" data-member-id="${member.id}" title="Chuyển / sửa PT Note">•••</button>
    </div>
  `;
}

function renderMembers() {
  return `
    <section class="page">
      ${pageHeader('Thành viên', 'Quản lý thông tin, phái, chức vụ, ghi chú và vị trí PT của toàn bộ thành viên.', `
        <button class="btn ghost" data-page-link="settings">⚙ Quản lý chức vụ</button>
        <button class="btn primary" data-action="open-member-form">＋ Thêm thành viên</button>
      `)}

      <div class="toolbar-card">
        <label class="search-box"><span>⌕</span><input id="member-search" type="search" placeholder="Tìm theo tên, phái, chức vụ, note..." value="${e(state.memberSearch)}" /></label>
        <select id="filter-class"><option value="">Tất cả phái</option>${(state.snapshot.factions || []).map((faction) => `<option value="${e(faction.id)}" ${state.memberFaction === faction.id ? 'selected' : ''}>${e(faction.name)}</option>`).join('')}</select>
        <select id="filter-role"><option value="">Tất cả chức vụ</option>${state.snapshot.roles.map((role) => `<option value="${role.id}" ${state.memberRole === role.id ? 'selected' : ''}>${e(role.name)}</option>`).join('')}</select>
        <select id="filter-pt"><option value="">Tất cả trạng thái PT</option><option value="assigned" ${state.memberPt === 'assigned' ? 'selected' : ''}>Đã có PT</option><option value="unassigned" ${state.memberPt === 'unassigned' ? 'selected' : ''}>Chưa có PT</option></select>
        <span class="result-count">${state.snapshot.members.length}/${state.snapshot.members.length} thành viên</span>
      </div>

      <div class="table-card">
        <div class="member-table table-head">
          <div>Thành viên</div><div>Phái</div><div>Chức vụ</div><div>Note cá nhân</div><div>PT hiện tại</div><div></div>
        </div>
        <div class="table-body">
          ${state.snapshot.members.map(renderMemberRow).join('')}
          <div id="member-filter-empty" class="empty-state hidden">Không tìm thấy thành viên phù hợp.</div>
        </div>
      </div>
    </section>
  `;
}

function renderMemberRow(member) {
  const found = findAssignment(member.id);
  const color = factionColor(member);
  const searchText = `${member.name} ${factionName(member)} ${roleName(member.roleId)} ${member.note}`.toLocaleLowerCase('vi');
  return `
    <div class="member-table table-row faction-row" style="--faction-color:${color}" data-member-row data-member-id="${member.id}" data-search="${e(searchText)}" data-faction-id="${e(member.factionId || '')}" data-role-id="${e(member.roleId || '')}" data-assigned="${found ? '1' : '0'}">
      <div class="member-cell identity"><button type="button" class="member-avatar avatar-preview-button" data-action="view-member-avatar" data-member-id="${e(member.id)}" title="Xem avatar ${e(member.name)}">${avatarContent(member)}</button><div><strong>${e(member.name)}</strong><span>${e(member.id)}</span></div></div>
      <div><span class="class-chip faction-chip"><i class="faction-dot"></i>${e(factionName(member))}</span></div>
      <div><span class="role-chip ${roleName(member.roleId).toLowerCase() === 'lead' ? 'lead' : ''}">${e(roleName(member.roleId))}</span></div>
      <div class="note-cell">${member.note ? e(member.note) : '<span class="muted-text">—</span>'}</div>
      <div>${found ? `<div class="pt-path"><strong>${e(found.legion.name.replace(/^ĐOÀN \d+ – /, ''))}</strong><span>${e(found.party.name)} · Position #${found.assignment.position}</span></div>` : '<span class="unassigned-chip">Chưa xếp PT</span>'}</div>
      <div class="row-actions">
        <button class="icon-btn" data-action="open-member-form" data-member-id="${member.id}" title="Chỉnh sửa">✎</button>
        <button class="icon-btn" data-action="open-move" data-member-id="${member.id}" title="Chuyển PT">↪</button>
        <button class="icon-btn danger" data-action="delete-member" data-member-id="${member.id}" title="Xóa">×</button>
      </div>
    </div>
  `;
}

function applyMemberFilters() {
  const query = state.memberSearch.trim().toLocaleLowerCase('vi');
  let visible = 0;
  root.querySelectorAll('[data-member-row]').forEach((row) => {
    const matchesSearch = !query || (row.dataset.search || '').includes(query);
    const matchesFaction = !state.memberFaction || row.dataset.factionId === state.memberFaction;
    const matchesRole = !state.memberRole || row.dataset.roleId === state.memberRole;
    const matchesPt = !state.memberPt || (state.memberPt === 'assigned' ? row.dataset.assigned === '1' : row.dataset.assigned === '0');
    const show = matchesSearch && matchesFaction && matchesRole && matchesPt;
    row.classList.toggle('hidden', !show);
    if (show) visible += 1;
  });
  const count = root.querySelector('.result-count');
  if (count) count.textContent = `${visible}/${state.snapshot.members.length} thành viên`;
  root.querySelector('#member-filter-empty')?.classList.toggle('hidden', visible !== 0);
}

function renderFormations() {
  return `
    <section class="page">
      ${pageHeader('Danh sách đoàn / PT', `Quản lý cấu trúc PT. Mỗi PT chứa trực tiếp tối đa ${PARTY_CAPACITY} thành viên, position 1–${PARTY_CAPACITY}.`, '')}
      <div class="management-grid">
        ${state.snapshot.legions.map((legion) => `
          <article class="manage-legion ${legion.type.toLowerCase()}">
            <div class="manage-legion-head"><div><span class="type-badge">${typeLabel(legion.type)}</span><h3>${e(legion.name)}</h3></div><button class="btn small secondary" data-action="add-party" data-legion-id="${legion.id}">＋ Thêm PT</button></div>
            <div class="manage-party-list">
              ${legion.parties.map((party) => `<div class="manage-party-row">
                  <div><strong>${e(party.name)}</strong><span>${party.members.length}/${PARTY_CAPACITY} thành viên · position 1–${PARTY_CAPACITY}</span></div>
                  <div class="single-capacity"><span>PT <b>${party.members.length}/${PARTY_CAPACITY}</b></span></div>
                  <button class="icon-btn danger" data-action="delete-party" data-legion-id="${legion.id}" data-party-id="${party.id}" ${party.members.length ? 'disabled title="Chỉ xóa được PT trống"' : 'title="Xóa PT"'}>×</button>
                </div>`).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderNotes() {
  return `
    <section class="page narrow-page">
      ${pageHeader('Ghi chú chung', 'Global Note dành cho toàn đội hình, tách biệt hoàn toàn với Member Note và PT Note.', '')}
      <div class="editor-card">
        <div class="editor-card-head"><div><span class="section-kicker">GLOBAL NOTE</span><h2>Nội dung dùng chung</h2></div><span class="hint">Mỗi dòng là một ghi chú</span></div>
        <textarea id="global-notes-input" class="notes-editor" rows="14" placeholder="Nhập ghi chú chung...">${e(state.snapshot.globalNotes.join('\n'))}</textarea>
        <div class="form-footer"><span class="muted-text">Các ghi chú này xuất hiện ở trang Tổng quan và được chụp cùng đội hình.</span><button class="btn primary" data-action="save-notes">Lưu ghi chú</button></div>
      </div>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="page narrow-page">
      ${pageHeader('Cài đặt', 'Quản lý giao diện và các danh mục có thể mở rộng. Chức vụ không bị hard-code chỉ ở Bang Chúng và Lead.', '')}
      <div class="settings-card theme-settings-card">
        <div class="settings-head">
          <div><span class="section-kicker">GIAO DIỆN</span><h2>Theme</h2><p>Chọn Dark mode hoặc White mode. Lựa chọn được lưu trên trình duyệt và không cần backend.</p></div>
        </div>
        <div class="theme-choice-grid">
          <button class="theme-choice ${getTheme() === 'dark' ? 'active' : ''}" data-action="set-theme" data-theme-value="dark">
            <span class="theme-preview dark-preview"><i></i><i></i><i></i></span>
            <span><strong>Dark mode</strong><small>Gaming dark hiện tại</small></span>
          </button>
          <button class="theme-choice ${getTheme() === 'light' ? 'active' : ''}" data-action="set-theme" data-theme-value="light">
            <span class="theme-preview light-preview"><i></i><i></i><i></i></span>
            <span><strong>White mode</strong><small>Nền sáng, tương phản dịu</small></span>
          </button>
          <button class="theme-choice ${getTheme() === 'pastel' ? 'active' : ''}" data-action="set-theme" data-theme-value="pastel">
            <span class="theme-preview pastel-preview"><i></i><i></i><i></i></span>
            <span><strong>Pastel mode</strong><small>Hồng kem, lavender và xanh baby</small></span>
          </button>
          <button class="theme-choice ${getTheme() === 'christmas' ? 'active' : ''}" data-action="set-theme" data-theme-value="christmas">
            <span class="theme-preview christmas-preview"><i></i><i></i><i></i></span>
            <span><strong>Giáng sinh 🎄</strong><small>Đỏ nhung, vàng ấm và tuyết rơi</small></span>
          </button>
        </div>
        <div class="accent-picker">
          <div><strong>Màu chủ đạo</strong><small>Chọn màu để đổi điểm nhấn toàn trang</small></div>
          <div class="accent-swatches" role="group" aria-label="Màu chủ đạo">
            ${['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'].map((color) => `<button type="button" class="accent-swatch ${getAccent() === color ? 'active' : ''}" style="--swatch:${color}" data-action="set-accent" data-accent-value="${color}" aria-label="Chọn màu ${color}"></button>`).join('')}
            <label class="accent-custom" title="Chọn màu tùy ý"><input id="accent-color-input" type="color" value="${getAccent()}" aria-label="Chọn màu tùy ý"><span>＋</span></label>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-head"><div><span class="section-kicker">THÀNH VIÊN</span><h2>Quản lý chức vụ</h2><p>Thêm chức vụ mới như Đại Đương Gia, Nhị Đương Gia… khi cần.</p></div><button class="btn primary" data-action="add-role">＋ Thêm chức vụ</button></div>
        <div class="role-list">
          ${state.snapshot.roles.map((role) => `
            <div class="role-row"><div><span class="role-chip ${role.name.toLowerCase() === 'lead' ? 'lead' : ''}">${e(role.name)}</span>${role.locked ? '<small>Mặc định</small>' : '<small>Tùy chỉnh</small>'}</div><div class="row-actions"><button class="icon-btn" data-action="edit-role" data-role-id="${role.id}" title="Đổi tên">✎</button><button class="icon-btn danger" data-action="delete-role" data-role-id="${role.id}" ${role.locked ? 'disabled title="Chức vụ mặc định"' : 'title="Xóa"'}>×</button></div></div>
          `).join('')}
        </div>
      </div>

      <div class="settings-card danger-zone">
        <div><span class="section-kicker">DỮ LIỆU DEMO</span><h2>Khôi phục dữ liệu mẫu</h2><p>Chỉ dùng khi muốn đưa website về trạng thái demo ban đầu.</p></div>
        <button class="btn danger-btn" data-action="reset-demo">Khôi phục dữ liệu mẫu</button>
      </div>
    </section>
  `;
}

function bindCurrentPage() {
  if (state.page !== 'overview' && root._formationDragController) {
    root._formationDragController.abort();
    root._formationDragController = null;
  }
  root.querySelectorAll('[data-page-link]').forEach((el) => el.addEventListener('click', () => setPage(el.dataset.pageLink)));
  root.querySelectorAll('[data-action]').forEach((el) => el.addEventListener('click', handleAction));
  if (state.page === 'overview') {
    bindDragDrop({
      root,
      getSnapshot: () => state.snapshot,
      setSnapshot: (snapshot) => { state.snapshot = snapshot; },
      render: renderPagePreservingViewport,
      api,
      toast
    });
  }

  const search = root.querySelector('#member-search');
  if (search) search.addEventListener('input', (event) => {
    state.memberSearch = event.currentTarget.value;
    applyMemberFilters();
  });
  root.querySelector('#filter-class')?.addEventListener('change', (event) => { state.memberFaction = event.currentTarget.value; applyMemberFilters(); });
  root.querySelector('#filter-role')?.addEventListener('change', (event) => { state.memberRole = event.currentTarget.value; applyMemberFilters(); });
  root.querySelector('#filter-pt')?.addEventListener('change', (event) => { state.memberPt = event.currentTarget.value; applyMemberFilters(); });
  root.querySelector('#member-pool-faction')?.addEventListener('change', (event) => {
    state.memberPoolFaction = event.currentTarget.value;
    applyMemberPoolFilter();
  });
  root.querySelector('#member-pool-pt')?.addEventListener('change', (event) => {
    state.memberPoolPt = event.currentTarget.value;
    applyMemberPoolFilter();
  });
  root.querySelector('#member-pool-search')?.addEventListener('input', (event) => {
    state.memberPoolSearch = event.currentTarget.value;
    applyMemberPoolFilter();
  });
  if (state.page === 'members') applyMemberFilters();
  if (state.page === 'overview') applyMemberPoolFilter();
  root.querySelector('#accent-color-input')?.addEventListener('input', (event) => {
    setAccent(event.currentTarget.value);
    root.querySelectorAll('.accent-swatch').forEach((swatch) => swatch.classList.toggle('active', swatch.dataset.accentValue === event.currentTarget.value.toLowerCase()));
  });
}

function featureContext() {
  return {
    modalRoot,
    snapshot: state.snapshot,
    findAssignment,
    roleName,
    factionName,
    api,
    refresh,
    toast
  };
}

function openMemberAvatar(memberId) {
  const avatarMembers = (state.snapshot.members || []).filter((member) => memberAvatarSrc(member));
  const index = avatarMembers.findIndex((member) => member.id === memberId);
  const member = avatarMembers[index];
  if (!member) return toast('Thành viên này chưa có ảnh đại diện.', 'error');

  const src = memberAvatarSrc(member);
  const color = factionColor(member);
  openModal(modalRoot, {
    title: member.name,
    subtitle: `${factionName(member)} · ${roleName(member.roleId)}`,
    body: `
      <div class="member-avatar-view" style="--avatar-faction-color:${color}">
        <img src="${src}" alt="Ảnh đại diện ${e(member.name)}">
        <div class="member-avatar-caption"><i></i><strong>${e(member.name)}</strong><span>${e(factionName(member))}</span></div>
      </div>`,
    footer: `
      <div class="avatar-gallery-footer">
        <button type="button" class="btn secondary" id="avatar-prev">‹ Người trước</button>
        <span>${index + 1} / ${avatarMembers.length}</span>
        <button type="button" class="btn secondary" id="avatar-next">Người sau ›</button>
      </div>`
  });

  const openAt = (offset) => {
    const target = avatarMembers[(index + offset + avatarMembers.length) % avatarMembers.length];
    openMemberAvatar(target.id);
  };
  modalRoot.querySelector('#avatar-prev')?.addEventListener('click', () => openAt(-1));
  modalRoot.querySelector('#avatar-next')?.addEventListener('click', () => openAt(1));
}

async function handleAction(ev) {
  const btn = ev.currentTarget;
  const action = btn.dataset.action;
  try {
    if (action === 'view-member-avatar') {
      return openMemberAvatar(btn.dataset.memberId);
    }
    if (action === 'open-assign') return openAssignModal({ ...featureContext(), defaults: { legionId: btn.dataset.legionId, partyId: btn.dataset.partyId } });
    if (action === 'open-move') return openMoveModal({ ...featureContext(), memberId: btn.dataset.memberId });
    if (action === 'open-member-form') return openMemberForm({ ...featureContext(), memberId: btn.dataset.memberId || null });
    if (action === 'capture-page') {
      if (state.page !== 'overview') return toast('Chức năng Chụp trang chỉ dùng cho trang Tổng quan.', 'error');
      return captureFullOverview({ root, toast }).catch((error) => toast(error.message || 'Không thể chụp trang.', 'error'));
    }
    if (action === 'capture-legion') {
      const legion = byId(state.snapshot.legions, btn.dataset.legionId);
      return captureLegion({ root, legionId: btn.dataset.legionId, legionName: legion?.name || 'Đoàn', toast }).catch((error) => toast(error.message || 'Không thể chụp Đoàn.', 'error'));
    }
    if (action === 'delete-member') return confirmDeleteMember({ ...featureContext(), memberId: btn.dataset.memberId });
    if (action === 'save-notes') {
      const notes = document.querySelector('#global-notes-input').value.split('\n');
      await api.saveGlobalNotes(notes); await refresh(); return toast('Đã lưu ghi chú chung.');
    }
    if (action === 'add-party') { await api.addParty(btn.dataset.legionId); await refresh(); return toast('Đã thêm PT mới.'); }
    if (action === 'delete-party') { await api.deleteParty(btn.dataset.legionId, btn.dataset.partyId); await refresh(); return toast('Đã xóa PT trống.'); }
    if (action === 'add-role') return openRoleModal({ ...featureContext() });
    if (action === 'edit-role') return openRoleModal({ ...featureContext(), roleId: btn.dataset.roleId });
    if (action === 'delete-role') { await api.deleteRole(btn.dataset.roleId); await refresh(); return toast('Đã xóa chức vụ.'); }
    if (action === 'set-theme') {
      const selected = setTheme(btn.dataset.themeValue);
      updateThemeToggle(themeQuickToggle);
      renderPage();
      return toast(selected === 'pastel' ? 'Đã chuyển sang Pastel mode.' : selected === 'light' ? 'Đã chuyển sang White mode.' : 'Đã chuyển sang Dark mode.');
    }
    if (action === 'set-accent') {
      const selected = setAccent(btn.dataset.accentValue);
      root.querySelector('#accent-color-input').value = selected;
      root.querySelectorAll('.accent-swatch').forEach((swatch) => swatch.classList.toggle('active', swatch === btn));
      return toast('Đã đổi màu chủ đạo.');
    }
    if (action === 'reset-demo') return confirmReset();
  } catch (err) {
    toast(err.message || 'Có lỗi xảy ra.', 'error');
  }
}

function confirmReset() {
  openModal(modalRoot, {
    title: 'Khôi phục dữ liệu mẫu?',
    subtitle: 'Thao tác này không thể hoàn tác.',
    body: '<div class="confirm-copy"><strong>Dữ liệu hiện tại sẽ bị thay thế hoàn toàn.</strong><p>Danh sách thành viên, đội hình PT, chức vụ và ghi chú sẽ trở về trạng thái mẫu ban đầu.</p></div>',
    footer: '<button class="btn secondary" data-close-modal>Hủy</button><button class="btn danger-btn" id="confirm-reset">Xóa và khôi phục</button>'
  });
  modalRoot.querySelector('#confirm-reset').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Đang khôi phục…';
    try {
      await api.resetDemo();
      closeModal(modalRoot);
      await refresh();
      toast('Đã khôi phục dữ liệu mẫu.');
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Xóa và khôi phục';
      toast(error.message || 'Không thể khôi phục dữ liệu mẫu.', 'error');
    }
  });
}

function renderServerState({ title, message, retry = false, loading = false }) {
  root.innerHTML = `
    <section class="server-state" aria-live="polite">
      <div class="server-state-card">
        <div class="server-state-icon ${loading ? 'loading' : 'error'}">${loading ? '<span class="server-spinner"></span>' : '!'}</div>
        <div>
          <span class="section-kicker">SERVER</span>
          <h2>${e(title)}</h2>
          <p id="server-state-message">${e(message)}</p>
          ${loading ? '<div class="server-wake-progress"><i id="server-wake-progress"></i></div><small id="server-wake-detail">Đang gửi yêu cầu kiểm tra máy chủ…</small>' : ''}
        </div>
        ${retry ? '<button class="btn primary" id="retry-server">Thử lại</button>' : ''}
      </div>
    </section>
  `;
  if (retry) root.querySelector('#retry-server')?.addEventListener('click', initializeApp);
}

function updateWakeProgress({ attempt, elapsed, timeout, ready = false }) {
  const percent = ready ? 100 : Math.min(96, Math.max(4, (elapsed / timeout) * 100));
  const progress = root.querySelector('#server-wake-progress');
  const detail = root.querySelector('#server-wake-detail');
  const message = root.querySelector('#server-state-message');
  if (progress) progress.style.width = `${percent}%`;
  if (detail) detail.textContent = ready
    ? 'Máy chủ đã sẵn sàng. Đang tải dữ liệu…'
    : `Đang đánh thức máy chủ · lần kiểm tra ${attempt} · đã chờ ${Math.ceil(elapsed / 1000)} giây`;
  if (message && elapsed >= 12000 && !ready) message.textContent = 'Render đang khởi động lại dịch vụ. Quá trình này có thể mất khoảng 30–60 giây.';
}

async function initializeApp() {
  try {
    if (API_MODE === 'backend') {
      renderServerState({
        title: 'Đang kết nối đến server...',
        message: 'Server đang khởi động, vui lòng chờ một chút...',
        loading: true
      });
      await api.waitUntilReady(updateWakeProgress);
    }
    await refresh();
  } catch (error) {
    if (API_MODE === 'backend') {
      renderServerState({
        title: 'Không thể kết nối đến server',
        message: 'Vui lòng thử lại. Server Render có thể cần thêm thời gian để khởi động.',
        retry: true
      });
      return;
    }
    root.innerHTML = `<div class="fatal-error"><h2>Không thể khởi tạo Guild Manager</h2><p>${e(error.message || 'Có lỗi xảy ra.')}</p></div>`;
  }
}

function showLogin(message = '') {
  clearAuth();
  state.snapshot = null;
  document.body.classList.remove('is-authenticated');
  document.body.classList.add('auth-pending');
  const error = document.querySelector('#login-error');
  if (error) error.textContent = message;
  if (matchMedia('(pointer: fine)').matches) {
    setTimeout(() => document.querySelector('#login-username')?.focus(), 50);
  }
}

async function enterApp() {
  document.body.classList.add('is-authenticated');
  document.body.classList.remove('auth-pending');
  const user = getAuthUser();
  const name = document.querySelector('.user-chip strong');
  if (name && user?.displayName) name.textContent = user.displayName;
  await initializeApp();
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = document.querySelector('#login-submit');
  if (submit.disabled) return;
  const error = document.querySelector('#login-error');
  submit.disabled = true;
  submit.innerHTML = 'Đang đăng nhập…';
  error.textContent = '';
  try {
    const session = await login(document.querySelector('#login-username').value.trim(), document.querySelector('#login-password').value);
    saveAuth(session);
    setTheme('christmas');
    updateThemeToggle(themeQuickToggle);
    document.querySelector('#login-password').value = '';
    await enterApp();
  } catch (err) {
    error.textContent = err.message || 'Không thể đăng nhập.';
  } finally {
    submit.disabled = false;
    submit.innerHTML = '<span class="login-button-heart">♡</span> Đăng nhập <span>→</span>';
  }
});

document.querySelector('#toggle-password')?.addEventListener('click', (event) => {
  const input = document.querySelector('#login-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-label', input.type === 'password' ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
});
document.querySelector('#login-theme')?.addEventListener('click', () => toggleTheme());
document.querySelector('#logout-button')?.addEventListener('click', () => showLogin('Bạn đã đăng xuất an toàn.'));
window.addEventListener('auth:required', (event) => showLogin(event.detail?.message || 'Phiên đăng nhập đã hết hạn.'));

document.querySelector('#login-submit').disabled = false;
clearRememberedAuth();
if (getAuthToken()) enterApp(); else showLogin();
