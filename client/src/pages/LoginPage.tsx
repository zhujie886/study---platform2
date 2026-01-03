import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 增加一个状态来显示详细错误
  const [debugError, setDebugError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated } = useAuthStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugError(null);

    if (!email || !password) {
      toast.error('请填写所有字段');
      return;
    }

    try {
      console.log('🚀 开始登录请求:', { email });
      await login(email, password);
      toast.success('登录成功！');
    } catch (error: any) {
      console.error('登录错误详情:', error);

      const errorMsg = error.message || '登录失败';
      let displayMsg = errorMsg;

      // 智能错误提示
      if (errorMsg.includes('404')) {
        displayMsg = '无法连接到服务器 (404)。请确保后端服务已启动。';
      } else if (errorMsg.includes('Network Error')) {
        displayMsg = '网络错误。请检查后端是否在端口 3000 运行。';
      } else if (errorMsg.includes('401') || errorMsg.includes('Invalid credentials')) {
        displayMsg = '邮箱或密码错误，请检查后重试。';
      }

      toast.error(displayMsg);
      // 在界面上显示原始错误，方便调试
      setDebugError(`ErrorCode: ${error.code || 'Unknown'}\nMsg: ${error.message}\nURL: ${error.config?.url || 'Unknown'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-700">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              个人信息管理系统
            </h1>
            <p className="text-gray-600 mt-2">智能备忘录 · 日历 · 时间管理</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            {/* 调试信息显示区 */}
            {debugError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded text-xs whitespace-pre-wrap font-mono">
                <strong>调试信息 (请截图给开发者):</strong>
                <br />
                {debugError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-[color:var(--text-main)] font-medium rounded-lg hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 注册链接 */}
          <p className="mt-6 text-center text-sm text-gray-600">
            还没有账号？{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              立即注册
            </Link>
          </p>
            <p className="mt-2 text-center text-sm text-gray-600">
              管理员？{' '}
              <Link
                to="/admin/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                管理员登录
              </Link>
            </p>

        </div>

        {/* 演示账号 */}
        <div className="mt-4 text-center text-white text-sm bg-black/20 rounded-lg p-4 backdrop-blur-sm">
          <p className="font-medium mb-1">💡 提示</p>
          <p>如果是第一次使用，请先点击"立即注册"</p>
        </div>
      </div>
    </div>
  );
}


