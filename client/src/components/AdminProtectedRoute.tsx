import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';

const decodeJwtPayload = (token: string) => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const AdminProtectedRoute = () => {
  const token = localStorage.getItem('adminToken');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      return;
    }

    // Simple JWT payload check (base64url-compatible).
    const payload = decodeJwtPayload(token);
    if (!payload) {
      localStorage.removeItem('adminToken');
      setIsValid(false);
      return;
    }

    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      toast.error(t('管理员会话已过期，请重新登录'));
      localStorage.removeItem('adminToken');
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  }, [token]);

  if (isValid === null) {
    return <div>{t('加载中...')}</div>;
  }

  return isValid ? <Outlet /> : <Navigate to="/admin/login" state={{ from: location }} replace />;
};

export default AdminProtectedRoute;

