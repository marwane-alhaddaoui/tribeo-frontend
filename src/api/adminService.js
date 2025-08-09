import api from './axiosClient';


// user management
export const getAllUsers = async () => {
  const res = await api.get('/users/admin/users/');
  return res.data;
};

export const deleteUser = async (userId) => {
  await api.delete(`/users/admin/users/${userId}/`);
};

export const updateUser = async (id, updatedData) => {
  const res = await api.put(`/users/admin/users/${id}/`, updatedData);
  return res.data;
};


// SESSION MANAGEMENT
export const getAllSessionsAdmin = async () => {
  const res = await api.get('/sport_sessions/admin/sessions/');
  return res.data;
};

// 🔹 Supprimer une session
export const deleteSession = async (sessionId) => {
  await api.delete(`/sport_sessions/admin/sessions/${sessionId}/`);
};


export const updateSession = async (id, data) => {
  const res = await api.patch(`/sport_sessions/admin/sessions/${id}/`, data);
  return res.data;
};

