import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  BookmarkIcon,
  SparklesIcon,
  UserGroupIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { socketService } from '@/services/socket';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/store/useThemeStore';
import ParticleEffectLayer from './ParticleEffectLayer';
import FloatingHub from './FloatingHub';
import { PersonalizationLayer } from './PersonalizationLayer';
import { MagicDock } from './MagicDock';

export default function Layout() {
  const { theme, setTheme } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const showMagicDock = location.pathname.startsWith('/personalize');

  useEffect(() => {
    setTheme(theme.name);
    socketService.onNotification((notification: any) => {
      toast(notification.message, {
        icon: '🔔',
        duration: 5000,
      });
    });
    return () => socketService.removeAllListeners();
  }, []);

  const navigation = [
    { name: '仪表盘', href: '/', icon: HomeIcon },
    { name: '提问广场', href: '/community', icon: UserGroupIcon },
    { name: '发布动态', href: '/social', icon: SparklesIcon },
    { name: '备忘录', href: '/memos', icon: DocumentTextIcon },
    { name: '日历', href: '/calendar', icon: CalendarIcon },
    { name: '时间表', href: '/timeline', icon: ClockIcon },
    { name: '预约', href: '/booking', icon: BookmarkIcon },
    { name: '会议', href: '/video', icon: VideoCameraIcon },
    { name: '个性化', href: '/personalize', icon: PaintBrushIcon },
  ];

  const sidebarWidth = collapsed ? 16 : 256;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background-main)', color: 'var(--text-main)' }}
    >
      {theme.effects?.particles && <ParticleEffectLayer />}

      <aside
        className="fixed inset-y-0 left-0 border-r transition-all duration-300"
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: 'var(--sidebar-bg, var(--panel-bg, var(--background-main)))',
          borderColor: 'var(--panel-border, rgba(128, 128, 128, 0.2))',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        }}
      >
        <div className="flex flex-col h-full">
          {!collapsed && (
            <div
              className="flex items-center justify-center h-16 border-b transition-colors duration-300"
              style={{
                borderColor: 'var(--panel-border, rgba(128, 128, 128, 0.2))',
                background: 'linear-gradient(120deg, transparent, var(--panel-bg, transparent) 60%)',
              }}
            >
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--primary-color)' }}>
                信息管理中心
              </h1>
            </div>
          )}

          {!collapsed && (
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--accent-color)' : 'var(--text-main)',
                    backgroundColor: isActive
                      ? 'var(--active-bg, rgba(255,255,255,0.08))'
                      : 'var(--hover-bg, transparent)',
                    fontWeight: isActive ? '600' : '400',
                    boxShadow: isActive ? '0 6px 20px rgba(0,0,0,0.14)' : 'none',
                    border: isActive ? '1px solid var(--panel-border, transparent)' : '1px solid transparent',
                  })}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-[46px] w-9 h-9 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.12)] bg-white border border-pink-100 ring-2 ring-white flex items-center justify-center text-sm text-gray-700 hover:bg-gradient-to-br hover:from-white hover:to-pink-50 hover:shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition z-10"
          title={collapsed ? '展开侧栏' : '收起侧栏'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      <main style={{ paddingLeft: `${sidebarWidth}px`, transition: 'padding-left 0.3s ease' }}>
        <div className="py-6 px-8">
          <Outlet />
        </div>
      </main>

      <FloatingHub />
      {showMagicDock && <MagicDock />}
      <PersonalizationLayer />
    </div>
  );
}



