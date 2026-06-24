import axios from 'axios';

// Same-origin in dev (Vite proxy) and prod (Vercel rewrites /api → backend).
// Do not set VITE_API_URL in production — cross-origin cookies are blocked by browsers.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;