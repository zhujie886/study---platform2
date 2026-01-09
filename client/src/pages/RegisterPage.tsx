import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, isAuthenticated } = useAuthStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fromState = (location.state as any)?.from;
    const redirect =
      (fromState?.pathname
        ? `${fromState.pathname}${fromState.search || ''}${fromState.hash || ''}`
        : null) ||
      localStorage.getItem('authRedirect') ||
      '/';
    localStorage.removeItem('authRedirect');
    navigate(redirect, { replace: true });
  }, [isAuthenticated, location.state, navigate]);

  const validatePassword = (pwd: string) => {
      // 至少6位，包含字母和数字
      const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
      return regex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword) {
      toast.error(t('register.error.fillAll'));
      return;
    }

    // 修复: 增加校验逻辑
    if (username.length < 2 || username.length > 20) {
        toast.error(t('register.error.usernameLength'));
        return;
    }

    if (!validatePassword(password)) {
        toast.error(t('register.error.passwordRule'));
        return;
    }

    if (password !== confirmPassword) {
      toast.error(t('register.error.passwordMismatch'));
      return;
    }

    try {
      await register(email, username, password);
      toast.success(t('register.error.success'));
    } catch (error: any) {
      // 修复: 细化错误提示
      const status = error.response?.status;
      if (status === 400) {
          toast.error(error.response.data.error || t('register.error.badRequest'));
      } else if (status === 409) {
          toast.error(t('register.error.userExists'));
      } else {
          toast.error(t('register.error.failed'));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-700">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {t('register.title')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.username')}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder={t('register.passwordPlaceholder')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.confirmPassword')}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg disabled:opacity-50">
              {isLoading ? t('register.loading') : t('register.submit')}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            {t('register.hasAccount')} <Link to="/login" className="text-primary-600 font-medium">{t('register.loginNow')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
