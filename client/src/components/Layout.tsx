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
import { useLanguage } from '@/i18n/LanguageContext';

export default function Layout() {
  const { theme, setTheme } = useThemeStore();
  const { t } = useLanguage();
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
    { key: 'nav.dashboard', href: '/', icon: HomeIcon },
    { key: 'nav.community', href: '/community', icon: UserGroupIcon },
    { key: 'nav.social', href: '/social', icon: SparklesIcon },
    { key: 'nav.memos', href: '/memos', icon: DocumentTextIcon },
    { key: 'nav.calendar', href: '/calendar', icon: CalendarIcon },
    { key: 'nav.timeline', href: '/timeline', icon: ClockIcon },
    { key: 'nav.booking', href: '/booking', icon: BookmarkIcon },
    { key: 'nav.meeting', href: '/video', icon: VideoCameraIcon },
    { key: 'nav.personalize', href: '/personalize', icon: PaintBrushIcon },
  ];

  const sidebarWidth = collapsed ? 16 : 256;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background-main)', color: 'var(--text-main)' }}
    >
      {theme.effects?.particles && <ParticleEffectLayer />}

      <aside
        className="fixed inset-y-0 left-0 border-r transition-all duration-300 sidebar-shell"
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: 'var(--sidebar-bg, var(--panel-bg, var(--background-main)))',
          borderColor: 'var(--panel-border, rgba(128, 128, 128, 0.2))',
          boxShadow: 'var(--sidebar-shadow)',
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
                {t('sidebar.title')}
              </h1>
            </div>
          )}

          {!collapsed && (
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    [
                      'nav-item flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200',
                      isActive ? 'nav-item-active font-semibold' : 'font-medium',
                    ].join(' ')
                  }
                >
                  <item.icon className="w-5 h-5 mr-3 nav-icon" />
                  {t(item.key)}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-[46px] w-9 h-9 rounded-full flex items-center justify-center text-sm transition nav-toggle z-10"
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
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



