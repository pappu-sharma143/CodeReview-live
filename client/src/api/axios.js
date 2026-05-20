import axios from 'axios';

// One configured axios instance used everywhere in the app
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
  // ↑ tells axios to send cookies with every request
  // Without this, browser blocks cookies on cross-origin requests
});

export default api;