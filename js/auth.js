import { API_BASE_URL } from './config.js?v=20260818-render-api1';

const TOKEN_KEY = 'guild-manager-auth-token';
const USER_KEY = 'guild-manager-auth-user';
const LEGACY_USERNAME = 'vxcc';
const LEGACY_PASSWORD = 'vxccnonvl';

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getAuthUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export function saveAuth(session) {
  clearAuth();
  sessionStorage.setItem(TOKEN_KEY, session.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearRememberedAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
  });
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
  });
  const body = await response.json().catch(() => null);
  // Backward compatibility while the Render API is still running the version
  // from before server-side authentication was added. Remove this fallback
  // after the updated backend has been deployed.
  if (response.status === 404 && username === LEGACY_USERNAME && password === LEGACY_PASSWORD) {
    return {
      token: `legacy-${Date.now()}`,
      user: { username: LEGACY_USERNAME, displayName: 'Leader' },
      legacy: true
    };
  }
  if (!response.ok) throw new Error(body?.message || 'Không thể đăng nhập.');
  return body;
}
