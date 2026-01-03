import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '@/services/api';

function AdminLoginPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await adminAPI.login(key);
      const token = response.data?.token;
      if (!token) {
        throw new Error('未获取到管理员令牌');
      }
      localStorage.setItem('adminToken', token);
      toast.success('管理员登录成功');
      const redirect = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(redirect);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || '登录失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">管理员登录</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="admin-key" className="sr-only">
              管理员密钥
            </label>
            <input
              id="admin-key"
              name="key"
              type="password"
              required
              className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="请输入管理员密码"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
    </div>
  );
}

export default AdminLoginPage;
