const STORAGE_KEY = 'guild-manager-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';
const PASTEL_THEME = 'pastel';
const ACCENT_STORAGE_KEY = 'guild-manager-accent';
const DEFAULT_ACCENT = '#8b5cf6';

function normalizeTheme(value) {
  return [DARK_THEME, LIGHT_THEME, PASTEL_THEME].includes(value) ? value : PASTEL_THEME;
}

export function getTheme() {
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch { stored = null; }
  return normalizeTheme(document.documentElement.dataset.theme || stored);
}

export function setTheme(theme) {
  const value = normalizeTheme(theme);
  document.documentElement.dataset.theme = value;
  document.documentElement.style.colorScheme = value === DARK_THEME ? 'dark' : 'light';
  if (value === PASTEL_THEME) {
    document.documentElement.style.setProperty('--purple', '#df5b9c');
    document.documentElement.style.setProperty('--purple-rgb', '223,91,156');
  } else {
    const accent = getAccent();
    const rgb = [1, 3, 5].map((index) => Number.parseInt(accent.slice(index, index + 2), 16)).join(',');
    document.documentElement.style.setProperty('--purple', accent);
    document.documentElement.style.setProperty('--purple-rgb', rgb);
  }
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Theme vẫn áp dụng trong phiên hiện tại. */ }
  return value;
}

export function toggleTheme() {
  const current = getTheme();
  return setTheme(current === DARK_THEME ? LIGHT_THEME : current === LIGHT_THEME ? PASTEL_THEME : DARK_THEME);
}

export function initTheme() {
  setAccent(getAccent());
  return setTheme(getTheme());
}

export function getAccent() {
  let stored = null;
  try { stored = localStorage.getItem(ACCENT_STORAGE_KEY); } catch { stored = null; }
  return /^#[0-9a-f]{6}$/i.test(stored || '') ? stored.toLowerCase() : DEFAULT_ACCENT;
}

export function setAccent(color) {
  const value = /^#[0-9a-f]{6}$/i.test(color || '') ? color.toLowerCase() : DEFAULT_ACCENT;
  const rgb = [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16)).join(',');
  document.documentElement.style.setProperty('--purple', value);
  document.documentElement.style.setProperty('--purple-rgb', rgb);
  try { localStorage.setItem(ACCENT_STORAGE_KEY, value); } catch { /* Màu vẫn áp dụng trong phiên hiện tại. */ }
  document.documentElement.classList.remove('accent-changing');
  requestAnimationFrame(() => document.documentElement.classList.add('accent-changing'));
  return value;
}

export function updateThemeToggle(button) {
  if (!button) return;
  const theme = getTheme();
  const labels = { dark: 'Dark mode', light: 'White mode', pastel: 'Pastel mode' };
  const next = theme === DARK_THEME ? LIGHT_THEME : theme === LIGHT_THEME ? PASTEL_THEME : DARK_THEME;
  button.innerHTML = theme === PASTEL_THEME ? '<span aria-hidden="true">✿</span>' : theme === LIGHT_THEME ? '<span aria-hidden="true">☀</span>' : '<span aria-hidden="true">☾</span>';
  button.setAttribute('aria-label', `Đang dùng ${labels[theme]}. Chuyển sang ${labels[next]}`);
  button.title = `${labels[theme]} · bấm để chuyển ${labels[next]}`;
}
