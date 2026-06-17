import axios from 'axios';

// Same-origin in dev (Vite proxies /api → backend). Override with VITE_API_URL in prod.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;