import { createContext, useState, useEffect, useMemo } from 'react';
import { loginUser, getProfile } from '../api/authService';
import { saveToken, getToken, clearToken } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session on mount / token change
  useEffect(() => {
    let alive = true;

    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getProfile();
        if (!alive) return;
        setUser(res.data);
      } catch {
        // token invalide → purge + reset
        logout();
      } finally {
        if (alive) setLoading(false);
      }
    };

    setLoading(true);
    init();
    return () => {
      alive = false;
    };
  }, [token]);

  // Login avec un seul champ "identifier" (email OU username)
  const login = async (identifier, password) => {
  try {
    const res = await loginUser({ identifier, password });
    const access = res?.data?.access ?? res?.data?.token;
    if (access) {
      saveToken(access);
      setToken(access);
      const profile = await getProfile();
      setUser(profile.data);
    }
    return res;
  } catch (err) {
    console.error('LOGIN 400 ->', err.response?.data || err.message);
    throw err;
  }
};

  const logout = () => {
    clearToken();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      setUser, // utile après update profil
      isAuthenticated: Boolean(user && token),
    }),
    [user, token, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
