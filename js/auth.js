import { API_BASE_URL } from './config.js?v=20260818-render-api1';

const TOKEN_KEY = 'guild-manager-auth-token';
const USER_KEY = 'guild-manager-auth-user';
const LEGACY_USERNAME = 'vxcc';
const LEGACY_PASSWORD = 'vxccnonvl';
let activeSession = null;

export function getAuthToken() {
  if (activeSession) return activeSession.token;
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function getAuthUser() {
  if (activeSession) return activeSession.user;
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export function saveAuth(session) {
  clearAuth();
  activeSession = session;
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
    sessionStorage.setItem(TOKEN_KEY, session.token);
  } catch { /* The active tab can still use the session in memory. */ }
}

export function clearRememberedAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* The browser may block storage. */ }
}

export function clearAuth() {
  activeSession = null;
  clearRememberedAuth();
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch { /* The browser may block storage. */ }
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
