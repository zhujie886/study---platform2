import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, isAuthenticated } = useAuthStore();
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
      toast.error('请填写所有字段');
      return;
    }

    // 修复: 增加校验逻辑
    if (username.length < 2 || username.length > 20) {
        toast.error('用户名长度应在2-20位之间');
        return;
    }

    if (!validatePassword(password)) {
        toast.error('密码至少6位，且需包含字母和数字');
        return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    try {
      await register(email, username, password);
      toast.success('注册成功！');
    } catch (error: any) {
      // 修复: 细化错误提示
      const status = error.response?.status;
      if (status === 400) {
          toast.error(error.response.data.error || '请求参数错误');
      } else if (status === 409) {
          toast.error('用户已存在');
      } else {
          toast.error('注册失败，请稍后重试');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-700">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              创建账号
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱地址</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="至少6位，含字母数字" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg disabled:opacity-50">
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            已有账号？ <Link to="/login" className="text-primary-600 font-medium">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

