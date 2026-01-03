import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export const DashboardSidebarContainer = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
        className={`sidebar-transition relative h-full bg-white border-r border-gray-200 shadow-sm ${collapsed ? 'w-5 sidebar-collapsed' : 'w-64 sidebar-expanded'}`}
    >
        {/* 折叠/展开 触发条 */}
        <button 
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-toggle-btn"
            title={collapsed ? "展开仪表盘" : "收起仪表盘"}
        >
            {collapsed ? <ChevronRightIcon className="w-4 h-4"/> : <ChevronLeftIcon className="w-4 h-4"/>}
        </button>

        {/* 内容区 */}
        <div className="sidebar-content h-full overflow-y-auto">
            {children}
        </div>
    </div>
  );
};

