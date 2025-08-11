import axiosClient from './axiosClient';

export const registerUser = (data) => {
  return axiosClient.post('/auth/register/', {
    ...data,
    username: data.username?.trim().toLowerCase(),
  });
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

export const loginUser = ({ identifier, password }) => {
  const id = String(identifier || '').trim();
  const payload = isEmail(id)
    ? { email: id, password }       // <= email si c’est un email
    : { username: id, password };   // <= sinon username

  return axiosClient.post('/auth/login/', payload);
};

export const getProfile = () => {
  return axiosClient.get('/auth/profile/');
};

export const updateMe = (partial) => {
  return axiosClient.patch('/auth/profile/', partial);
};
