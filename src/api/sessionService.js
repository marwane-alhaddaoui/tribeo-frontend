import axiosClient from './axiosClient';

export const getSessions = () => {
  return axiosClient.get('/sessions/');
};
