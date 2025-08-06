import axiosClient from './axiosClient';

// 🔄 GET toutes les sessions
export const getSessions = () => {
  return axiosClient.get('/sessions/');
};

// 📄 GET une session par ID
export const getSessionDetail = (id) => {
  return axiosClient.get(`/sessions/${id}/`);
};

// ➕ POST créer une session
export const createSession = (data) => {
  return axiosClient.post('/sessions/', data);
};

// ✅ POST rejoindre une session
export const joinSession = (id) => {
  return axiosClient.post(`/sessions/${id}/join/`);
};

// ❌ POST quitter une session
export const leaveSession = (id) => {
  return axiosClient.post(`/sessions/${id}/leave/`);
};

export const getSessionById = (id) => {
  return axiosClient.get(`/sessions/${id}/`);
};
