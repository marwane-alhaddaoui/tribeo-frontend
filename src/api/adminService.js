import api from './axiosClient';

export const getAllUsers = async () => {
  const res = await api.get('/users/admin/users/');
  return res.data;
};

export const getAllSessions = async () => {
  const res = await api.get('/sport_sessions/admin/sessions/');
  return res.data;
};
