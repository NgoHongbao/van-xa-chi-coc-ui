export const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((part) => part[0] || '').join('').toUpperCase();
