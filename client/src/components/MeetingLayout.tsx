import { Outlet } from 'react-router-dom';

/**
 * 会议独立布局
 * 提供一个无侧边栏、无导航栏的沉浸式环境
 */
export default function MeetingLayout() {
  return (
    <div className="w-screen h-screen bg-gray-900">
      <Outlet />
    </div>
  );
}


