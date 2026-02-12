import { useState, useEffect, ReactNode } from 'react';
import { AuthContext, User } from '../contexts/AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserInfo(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch('/api/v1/users/me', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (response.ok) {
        const userData = await response.json();
        const userObj: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role || 'user',
          display_name: userData.display_name
        };
        setUser(userObj);
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        // 只有明确的401才清除token（token确实过期或无效）
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // 其他错误（500、网络问题等）保留token，不强制登出
        // 用户可能只是遇到了暂时性问题
        console.warn('获取用户信息失败，状态码:', response.status);
        setIsAuthenticated(true); // 保持登录状态
      }
    } catch (error) {
      // 网络错误不清除token，保持当前状态
      console.error('网络错误，无法获取用户信息:', error);
      // 如果有token就保持认证状态，避免网络抖动导致登出
      if (authToken) {
        setIsAuthenticated(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setLoading(true);
    await fetchUserInfo(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
