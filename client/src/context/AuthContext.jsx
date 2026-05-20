import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// Context = a global store any component can read
// No prop drilling — any component just calls useAuth()
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // who's logged in
  const [loading, setLoading] = useState(true); // are we checking?

  // On app load — check if cookie exists and get user info
  // This handles page refreshes — user stays logged in
  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null)) // no cookie or expired = not logged in
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Cookie is set by server automatically
    // We just store the user object in state
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout'); // server clears cookie
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {/* Don't render children until we know if user is logged in */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook — any component calls this to get user/login/logout
export const useAuth = () => useContext(AuthContext);