import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('token');
  const location = useLocation();

  // 只要 Store 显示已登录，或者 LocalStorage 里有 Token，就放行
  if (isAuthenticated || token) {
    return <>{children}</>;
  }

  const redirectPath = `${location.pathname}${location.search}${location.hash}`;
  localStorage.setItem('authRedirect', redirectPath);
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;


