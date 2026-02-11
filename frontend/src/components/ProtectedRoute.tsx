import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: 'admin' | 'moderator' | 'user';
}

const roleLevel: Record<string, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

const ProtectedRoute = ({ children, requiredRole = 'user' }: ProtectedRouteProps) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  if (!authContext) {
    return <Navigate to="/login" replace />;
  }

  const { isAuthenticated, token, user } = authContext;

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 角色权限检查：admin > moderator > user
  if (requiredRole !== 'user' && user) {
    const userLevel = roleLevel[user.role] || 0;
    const requiredLevel = roleLevel[requiredRole] || 0;
    if (userLevel < requiredLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
