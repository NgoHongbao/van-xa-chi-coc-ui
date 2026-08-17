import { API_BASE_URL } from '../config.js?v=20260818-render-api1';

const DEFAULT_RETRY_DELAY = 2500;
const MAX_RETRIES = 3;
const WAKE_TIMEOUT = 90000;
const WAKE_INTERVAL = 2500;
const WAKE_REQUEST_TIMEOUT = 10000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableStatus(status) {
  return [408, 429, 502, 503, 504].includes(status);
}

function connectionError(cause) {
  const error = new Error('Không thể kết nối đến server. Vui lòng thử lại.');
  error.code = 'SERVER_UNREACHABLE';
  error.cause = cause;
  return error;
}

async function request(path, options = {}, retryOptions = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const retries = retryOptions.retries ?? (method === 'GET' ? MAX_RETRIES : 0);
  const retryDelay = retryOptions.retryDelay ?? DEFAULT_RETRY_DELAY;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });

      if (!response.ok && isRetryableStatus(response.status)) {
        if (attempt < retries) {
          await wait(retryDelay);
          continue;
        }
        throw connectionError(new Error(`HTTP ${response.status}`));
      }

      const body = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(body?.message || `API error ${response.status}`);
        error.code = body?.code;
        error.details = body?.details;
        throw error;
      }
      return body;
    } catch (error) {
      lastError = error;
      const networkFailure = error instanceof TypeError || error?.code === 'SERVER_UNREACHABLE';
      if (networkFailure && attempt < retries) {
        await wait(retryDelay);
        continue;
      }
      if (networkFailure) throw connectionError(error);
      throw error;
    }
  }

  throw connectionError(lastError);
}

export const realApi = {
  health: () => request('/health', {}, { retries: 0 }),
  waitUntilReady: async (onProgress = () => {}) => {
    const startedAt = Date.now();
    let attempt = 0;
    let lastError;
    while (Date.now() - startedAt < WAKE_TIMEOUT) {
      attempt += 1;
      const elapsed = Date.now() - startedAt;
      onProgress({ attempt, elapsed, timeout: WAKE_TIMEOUT });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), WAKE_REQUEST_TIMEOUT);
      try {
        const result = await request('/health', { signal: controller.signal }, { retries: 0 });
        clearTimeout(timer);
        onProgress({ attempt, elapsed: Date.now() - startedAt, timeout: WAKE_TIMEOUT, ready: true });
        return result;
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        const remaining = WAKE_TIMEOUT - (Date.now() - startedAt);
        if (remaining <= 0) break;
        await wait(Math.min(WAKE_INTERVAL, remaining));
      }
    }
    throw connectionError(lastError || new Error('Server wake-up timeout'));
  },
  getSnapshot: () => request('/snapshot'),
  getFactions: () => request('/factions'),
  createMember: (payload) => request('/members', { method: 'POST', body: JSON.stringify(payload) }),
  updateMember: (id, payload) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMember: (id) => request(`/members/${id}`, { method: 'DELETE' }),
  assignMember: (payload) => request('/parties/assign-member', { method: 'POST', body: JSON.stringify(payload) }),
  moveMember: ({ memberId, partyId, targetPosition, note, noteColor }) => request('/parties/move-member', {
    method: 'PATCH', body: JSON.stringify({ memberId, targetPartyId: partyId, targetPosition, note, noteColor })
  }),
  movePartyMember: ({ memberId, targetPartyId, targetPosition }) => request('/parties/move-member', {
    method: 'PATCH', body: JSON.stringify({ memberId, targetPartyId, targetPosition })
  }),
  swapPartyMembers: (payload) => request('/parties/swap-members', { method: 'PATCH', body: JSON.stringify(payload) }),
  updatePtNote: ({ memberId, note, noteColor }) => request(`/parties/member/${memberId}/note`, { method: 'PATCH', body: JSON.stringify({ note, noteColor }) }),
  removeFromParty: (memberId) => request(`/parties/member/${memberId}`, { method: 'DELETE' }),
  addParty: (legionId) => request('/parties', { method: 'POST', body: JSON.stringify({ legionId }) }),
  deleteParty: (_legionId, partyId) => request(`/parties/${partyId}`, { method: 'DELETE' }),
  saveGlobalNotes: (notes) => request('/global-notes', { method: 'PUT', body: JSON.stringify({ notes }) }),
  createRole: (name) => request('/roles', { method: 'POST', body: JSON.stringify({ name }) }),
  updateRole: (id, name) => request(`/roles/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteRole: (id) => request(`/roles/${id}`, { method: 'DELETE' }),
  saveFormation: () => request('/formations/save', { method: 'POST' }),
  resetDemo: () => request('/demo/reset', { method: 'POST' })
};
