import { fakeApi } from './fake-api.js?v=20260817-member75';
import { realApi } from './api/real-api.js?v=20260817-render-wakeup1';
import { API_MODE } from './config.js';

export const api = API_MODE === 'backend' ? realApi : fakeApi;
export { API_MODE };
