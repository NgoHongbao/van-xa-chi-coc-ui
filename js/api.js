import { fakeApi } from './fake-api.js?v=20260912-legion4';
import { realApi } from './api/real-api.js?v=20261121-mobile-login';
import { API_MODE } from './config.js?v=20260818-render-api1';

export const api = API_MODE === 'backend' ? realApi : fakeApi;
export { API_MODE };
