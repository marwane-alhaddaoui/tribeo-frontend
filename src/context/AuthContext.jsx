import { createContext, useState, useEffect } from 'react';
import { loginUser, getProfile } from '../api/authService';
import { saveToken, getToken, clearToken } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Récupère le profil utilisateur si un token existe
  useEffect(() => {
    const token = getToken();
    if (token) {
      getProfile()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
    setLoading(false);
  }, []);

  // Connexion (utilisé dans la page Login)
  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.data.access) {
      saveToken(res.data.access);
      const profile = await getProfile();
      setUser(profile.data);
    }
  };

  // Déconnexion
  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
