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


// --- Avatar helpers ---
// Upload d'un fichier (FormData)
export const uploadAvatar = (file) => {
  const fd = new FormData();
  fd.append('avatar', file);
  return axiosClient.patch('/auth/profile/', fd); // multipart auto via axiosClient
};

// Définir une URL distante comme avatar
export const setAvatarUrl = (url) => {
  return axiosClient.patch('/auth/profile/', { avatar_url: String(url || '').trim() });
};

// Réinitialiser l'avatar (revient au logo par défaut envoyé par l'API via avatar_src)
export const resetAvatar = () => {
  return axiosClient.patch('/auth/profile/', { avatar: null, avatar_url: null });
};



export const deleteMe = () => {
  return axiosClient.delete('/auth/profile/');
};