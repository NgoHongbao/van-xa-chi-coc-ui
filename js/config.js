const runtime = globalThis.window?.GUILD_MANAGER_CONFIG || {};
const storedMode = (() => {
  try { return localStorage.getItem('guild-manager-api-mode'); } catch { return null; }
})();

export const API_MODE = String(runtime.API_MODE || storedMode || 'mock').toLowerCase() === 'backend' ? 'backend' : 'mock';
export const API_BASE_URL = String(runtime.API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
