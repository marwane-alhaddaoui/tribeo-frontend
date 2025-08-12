import axios from 'axios';
import { clearToken } from '../utils/storage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false, // ✅ ne pas envoyer les cookies → évite CSRF
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTokenError =
      error.response?.data?.code === 'token_not_valid' ||
      error.response?.data?.detail?.includes('token');

    if (isTokenError) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
