import axiosClient from './axiosClient';

export const getSessions = () => {
  return axiosClient.get('/sessions/');
};


export const getSessionById = (id) => {
  return axiosClient.get(`/sessions/${id}/`);
};

export const createSession = (data) => {
  return axiosClient.post('/sessions/', data);
};