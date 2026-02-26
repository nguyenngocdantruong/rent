import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, logout as authLogout, fetchUserInfo } from './auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession());
  const [loading, setLoading] = useState(!!user);

  const refreshUser = useCallback(async () => {
    const session = getSession();
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const fullInfo = await fetchUserInfo(session.id || session.username);
      setUser({ ...session, ...fullInfo });
    } catch (err) {
      console.error('Lỗi lấy thông tin người dùng:', err);
      // Nếu lỗi API, vẫn giữ session cũ nhưng có thể hiển thị thông báo
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []);

  const login = (session) => {
    setUser(session);
    refreshUser();
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
