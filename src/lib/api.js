import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/api`;
  }
  // If running on local dev server, default to localhost:5000 backend
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  // In production (Vercel deployment), use relative URL to hit the same host's /api
  return '/api';
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
});

// Automatically inject JWT token into the header of every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
