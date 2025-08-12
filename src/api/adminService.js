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

// 🆕 Delete a group (admin route first, fallback to public if needed)
export const deleteGroupAdmin = async (id) => {
  try {
    // If your backend has a dedicated admin route:
    const res = await axiosClient.delete(`/admin/groups/${id}/`);
    return res.data;
  } catch (e) {
    const status = e?.response?.status;
    // If the admin route doesn’t exist, try the public one with a force flag (if your API supports it)
    if (status === 404) {
      const res = await axiosClient.delete(`/groups/${id}/`, { params: { force: 1 } });
      return res.data;
    }
    // 403 here usually means current token isn’t admin/staff. Let the caller handle it.
    throw e;
  }
};