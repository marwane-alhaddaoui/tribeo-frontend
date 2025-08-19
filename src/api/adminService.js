// src/api/adminService.js
import api from './axiosClient';

// ===== Users (admin) =====
export const getAllUsers = async () => {
  const res = await api.get('/users/admin/users/');
  return res.data;
};

export const deleteUser = async (userId) => {
  await api.delete(`/users/admin/users/${userId}/`);
};

// ⚠️ PATCH (partiel) > PUT
export const updateUser = async (id, updatedData) => {
  const res = await api.patch(`/users/admin/users/${id}/`, updatedData, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

// helper ciblé si tu veux juste changer le rôle
export const updateUserRole = async (id, role) => {
  const res = await api.patch(`/users/admin/users/${id}/`, { role }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

// ===== Sessions (admin) =====
export const getAllSessionsAdmin = async () => {
  const res = await api.get('/sport_sessions/admin/sessions/');
  return res.data;
};

export const deleteSession = async (sessionId) => {
  await api.delete(`/sport_sessions/admin/sessions/${sessionId}/`);
};

export const updateSession = async (id, data) => {
  const res = await api.patch(`/sport_sessions/admin/sessions/${id}/`, data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

// ===== Groups (admin) =====
// utilise la MÊME instance `api` avec JWT (pas axiosClient)
export const deleteGroupAdmin = async (id) => {
  try {
    const res = await api.delete(`/admin/groups/${id}/`);
    return res.data;
  } catch (e) {
    const status = e?.response?.status;
    if (status === 404) {
      // fallback si route admin absente et que ton API supporte force=1
      const res = await api.delete(`/groups/${id}/`, { params: { force: 1 } });
      return res.data;
    }
    throw e;
  }
};


// ===== Audit (admin) =====
export const exportAuditCsv = async ({ since, until } = {}) => {
  const res = await api.get('/admin/audit/export/', {
    params: { since, until },
    responseType: 'blob', // important : on récupère un fichier
  });

  // Essayer de lire le filename depuis les headers
  const dispo = res.headers?.['content-disposition'] || '';
  const m = dispo.match(/filename="?([^"]+)"?/i);
  const filename = m?.[1] || `audit_logs_${Date.now()}.csv`;

  return { blob: res.data, filename };
};

export const deleteAuditLogs = async ({ since, until } = {}) => {
  const res = await api.delete('/admin/audit/', {
    data: { since, until },
  });
  return res.data; // { deleted: n }
};
