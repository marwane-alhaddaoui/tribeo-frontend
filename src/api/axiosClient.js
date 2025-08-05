import axios from 'axios';
import { clearToken } from '../utils/storage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Ajoute le token à chaque requête
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ Intercepte les erreurs pour gérer token expiré
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTokenError =
      error.response?.data?.code === 'token_not_valid' ||
      error.response?.data?.detail?.includes('token');

    if (isTokenError) {
      clearToken();
      window.location.href = '/login'; // 🔁 redirection immédiate
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
