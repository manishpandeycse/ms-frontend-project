import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { refreshSession, setAccessToken, setSessionLostHandler } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionLostHandler(() => setUser(null));
    // Restore the session from the refresh cookie on page load
    refreshSession().then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback((data) => { setAccessToken(data.accessToken); setUser(data.user); return data.user; }, []);
  const login = useCallback(async (email, password) => authenticate((await api.post('/auth/login', { email, password })).data), [authenticate]);
  const register = useCallback(async (payload) => authenticate((await api.post('/auth/register', payload)).data), [authenticate]);
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setAccessToken(null); setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
