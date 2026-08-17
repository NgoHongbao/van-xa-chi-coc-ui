export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((part) => part[0] || '').join('').toUpperCase();
