import axiosClient from './axiosClient';

// 🔄 GET toutes les sessions + filtre
export const getSessions = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = queryParams ? `/sport_sessions/?${queryParams}` : '/sport_sessions/';
  try {
    const res = await axiosClient.get(url);
    return res.data.results ?? res.data;
  } catch (err) {
    console.error('Erreur récupération des sessions', err);
    return [];
  }
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

export const getSports = async () => {
  const response = await axiosClient.get('/sports/');
  return response.data;
};

// ➕ POST créer un sport
export const createSport = (data) => {
  return axiosClient.post('/sports/', data);
};

// 🚀 Publier une session
export const publishSession = (id) => {
  return axiosClient.post(`/sport_sessions/${id}/publish/`);
};

// 🛑 Annuler une session
export const cancelSession = (id) => {
  return axiosClient.post(`/sport_sessions/${id}/cancel/`);
};