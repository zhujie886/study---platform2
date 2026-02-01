import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { ArrowRightIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(t('登录成功！'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('登录失败，请检查邮箱和密码'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t('欢迎回来')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('登录您的个人信息管理系统')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('邮箱地址')}
              </label>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                placeholder={t('请输入邮箱')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('密码')}
              </label>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                placeholder={t('请输入密码')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? t('登录中...') : t('立即登录')}
              {!isLoading && <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {t('还没有账号？')}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 ml-1">
                {t('免费注册')}
              </Link>
            </div>

            {/* 管理员入口 - 修复跳转 */}
            <button 
              onClick={() => navigate('/admin/login')}
              className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CommandLineIcon className="h-4 w-4 mr-1" />
              {t('管理员登录')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

