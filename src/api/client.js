import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '') + 'api';

// Access token lives in memory only (never localStorage) so XSS cannot read it.
// The long-lived refresh token is an httpOnly cookie the browser sends automatically.
let accessToken = null;
let onSessionLost = () => {};
export const setAccessToken = (t) => { accessToken = t; };
export const setSessionLostHandler = (fn) => { onSessionLost = fn; };

const api = axios.create({ baseURL, withCredentials: true, timeout: 20000 });
const bare = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

// Single-flight refresh: concurrent 401s (and React StrictMode double effects) share ONE request
let refreshing = null;
export function refreshSession() {
  if (!refreshing) {
    refreshing = bare.post('/auth/refresh')
      .then((r) => { accessToken = r.data.accessToken; return r.data; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && original && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        await refreshSession();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        accessToken = null;
        onSessionLost();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
