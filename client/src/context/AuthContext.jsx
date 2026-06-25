import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { getToken, setToken, clearToken } from '../utils/token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
        if (status === 401 && !isAuthAttempt) {
          clearToken();
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    const token = getToken();

    if (!token) {
      setLoading(false);
      return () => api.interceptors.response.eject(interceptor);
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
