import { createContext, useState, useEffect } from 'react';
import { loginUser, getProfile } from '../api/authService';
import { saveToken, getToken, clearToken } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.data.access) {
      saveToken(res.data.access);
      setToken(res.data.access);  // ✅ MAJ immédiate du state
      const profile = await getProfile();
      setUser(profile.data);
    }
  };

  const logout = () => {
    clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
