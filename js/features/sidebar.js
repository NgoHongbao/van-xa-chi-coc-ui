const STORAGE_KEY = 'guild-manager-sidebar-collapsed';

export function bindSidebarToggle({ shell, button }) {
  if (!shell || !button) return;

  const apply = (collapsed) => {
    shell.classList.toggle('sidebar-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Hiện Sidebar' : 'Ẩn Sidebar');
    button.title = collapsed ? 'Hiện Sidebar' : 'Ẩn Sidebar';
    const icon = button.querySelector('span');
    if (icon) icon.textContent = collapsed ? '›' : '‹';
  };

  let collapsed = false;
  try { collapsed = localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* storage optional */ }
  apply(collapsed);

  button.addEventListener('click', () => {
    collapsed = !shell.classList.contains('sidebar-collapsed');
    apply(collapsed);
    try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch { /* storage optional */ }
  });
}
