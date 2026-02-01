import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/i18n/LanguageContext';

export const DashboardSidebarContainer = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();

  return (
    <div 
      className={sidebar-transition relative h-full bg-white border-r border-gray-200 shadow-sm }
    >
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="sidebar-toggle-btn"
        title={collapsed ? t('展开仪表盘') : t('收起仪表盘')}
      >
        {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
      </button>

      <div className="sidebar-content h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
