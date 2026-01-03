import { Outlet, Link, useNavigate } from 'react-router-dom';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h1 className="text-xl font-bold text-gray-900">Consultation Platform</h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-500">
            退出登录
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* 左侧侧边栏 */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            <Link to="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md">
              🏠 首页 (Home)
            </Link>
            <Link to="/calendar" className="flex items-center px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md">
              📅 日历 (Calendar)
            </Link>
            <Link to="/booking" className="flex items-center px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-md">
              📝 预约 (Booking)
            </Link>
          </nav>
        </aside>

        {/* 主内容区域 - 路由出口 */}
        <main className="flex-1 bg-white p-6 rounded-lg shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
