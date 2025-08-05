import axiosClient from './axiosClient';

export const registerUser = (data) => {
  return axiosClient.post('/auth/register/', data);
};

export const loginUser = (data) => {
  return axiosClient.post('/auth/login/', data);
};

export const getProfile = () => {
  return axiosClient.get('/auth/profile/');
};
