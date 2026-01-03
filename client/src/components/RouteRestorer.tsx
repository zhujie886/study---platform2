
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 这个组件需要被添加到 App.tsx 或 MainLayout 中
 * 它的作用是：
 * 1. 记录当前所在的页面路径
 * 2. 如果页面在根目录("/")加载，但记录显示上次在"/personalize"，则自动跳转回去
 */
export const RouteRestorer = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 记录路径
    useEffect(() => {
        if (location.pathname !== '/') {
            localStorage.setItem('last_active_route', location.pathname);
        }
    }, [location]);

    // 恢复路径
    useEffect(() => {
        const lastRoute = localStorage.getItem('last_active_route');
        // 如果当前是首页，且上次在个性化页面，则跳转
        if (location.pathname === '/' && lastRoute === '/personalize') {
            console.log("Restoring session to Personalize space...");
            navigate('/personalize');
        }
    }, [location, navigate]);

    return null;
};


