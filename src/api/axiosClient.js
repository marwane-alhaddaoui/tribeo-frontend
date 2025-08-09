import axios from 'axios';
import { clearToken } from '../utils/storage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 🔐 Ajoute le token et choisit le Content-Type automatiquement
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Déterminer Content-Type automatiquement
  if (config.data instanceof FormData) {
    // Laisser Axios gérer le Content-Type + boundary
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// ❌ Gérer token expiré
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
