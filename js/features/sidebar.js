const STORAGE_KEY = 'guild-manager-sidebar-collapsed';

export function bindSidebarToggle({ shell, button }) {
  if (!shell || !button) return;

  const mobile = matchMedia('(max-width: 760px)');
  const icon = button.querySelector('span');
  let mobileExpanded = false;
  let desktopCollapsed = false;

  try { desktopCollapsed = localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* storage optional */ }

  const apply = () => {
    const expanded = mobile.matches ? mobileExpanded : !desktopCollapsed;
    const label = expanded ? 'Ẩn menu điều hướng' : 'Hiện menu điều hướng';
    shell.classList.toggle('sidebar-collapsed', !mobile.matches && desktopCollapsed);
    shell.classList.toggle('mobile-menu-expanded', mobile.matches && mobileExpanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', label);
    button.title = label;
    if (icon) icon.textContent = mobile.matches ? (expanded ? '×' : '☰') : (expanded ? '‹' : '›');
  };

  apply();
  mobile.addEventListener('change', apply);
  button.addEventListener('click', () => {
    if (mobile.matches) {
      mobileExpanded = !mobileExpanded;
    } else {
      desktopCollapsed = !desktopCollapsed;
      try { localStorage.setItem(STORAGE_KEY, desktopCollapsed ? '1' : '0'); } catch { /* storage optional */ }
    }
    apply();
  });

  shell.querySelector('#app-nav')?.addEventListener('click', (event) => {
    if (!mobile.matches || !event.target.closest('.nav-item')) return;
    mobileExpanded = false;
    apply();
    button.focus({ preventScroll: true });
  });
}
