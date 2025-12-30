import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  console.log('[API] Request:', config.method?.toUpperCase(), config.url);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('[API] Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log('[API] Response:', res.status, res.config.url);
    return res;
  },
  (error) => {
    console.error('[API] Error:', error.response?.status, error.config?.url, error.response?.data);
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      console.warn('[API] Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
