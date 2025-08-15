import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { loginUser, getProfile, registerUser } from '../api/authService';
import { saveToken, getToken, clearToken } from '../utils/storage';
import { extractApiError } from '../utils/httpError';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
  const res = await getProfile();
  const normalized = { ...res.data, role: String(res.data?.role || "").toUpperCase() };
  setUser(normalized);
  return normalized;
}, []);

  // Bootstrap session on mount / token change
  useEffect(() => {
    let alive = true;
    const init = async () => {
      if (!token) { setLoading(false); return; }
          try {
      const res = await getProfile();
      if (!alive) return;
      const normalized = { ...res.data, role: String(res.data?.role || "").toUpperCase() };
      setUser(normalized);
    } catch {
  logout();
      } finally {
        if (alive) setLoading(false);
      }
    };
    setLoading(true);
    init();
    return () => { alive = false; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Login (identifier = email OU username)
  const login = async (identifier, password) => {
    try {
      const res = await loginUser({ identifier, password }); // POST /auth/login/
      const access = res?.data?.access ?? res?.data?.token;
      if (access) {
        saveToken(access);
        setToken(access);
        await refreshProfile();                // ⬅️ assure user à jour après login
      }
      return res;
    } catch (err) {
      console.error('LOGIN 400 ->', err.response?.data || err.message);
      throw err;
    }
  };

  // Register + auto-login si pas de token retourné par /auth/register/
  const register = async (payload) => {
    try {
      const res = await registerUser(payload);     // POST /auth/register/
      const access = res?.data?.access ?? res?.data?.token;

      if (access) {
        saveToken(access);
        setToken(access);
        await refreshProfile();
        return res;
      }

      try { await login(payload.email, payload.password); }
      catch { await login(payload.username, payload.password); }

      return true;
    } catch (err) {
      const msg = extractApiError(err);
      console.error('REGISTER 400 ->', msg, err.response?.data);
      throw new Error(msg);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    setUser,          // utile pour patch optimiste
    refreshProfile,   // ⬅️ exposé pour resync immédiate après /billing/verify/
    isAuthenticated: Boolean(user && token),
  }), [user, token, loading, login, register, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
