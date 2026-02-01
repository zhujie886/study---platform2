import { ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './i18n/LanguageContext';
import { translations, Lang } from './i18n/translations';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';

const getLang = (): Lang => {
  const saved = localStorage.getItem('app_lang') as Lang | null;
  return saved === 'en' || saved === 'zh' ? saved : 'zh';
};

const t = (key: string, fallback?: string) => {
  const lang = getLang();
  return translations[lang]?.[key] || translations.zh[key] || fallback || key;
};

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error(t('全局错误:'), event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error(t('未处理的Promise拒绝:'), event.reason);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <ThemeProvider><App /></ThemeProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error(t('渲染失败:'), error);
  const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const errorText = escapeHtml(
    error instanceof Error ? (error.stack || error.message) : String(error)
  );
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1 style="color: #ef4444; margin-bottom: 16px;">${t('页面加载失败')}</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">${t('请检查后端服务是否启动')}</p>
        <button
          onclick="window.location.reload()"
          style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
        >
          ${t('刷新页面')}
        </button>
        <details style="margin-top: 24px; text-align: left; max-width: 600px;">
          <summary style="cursor: pointer; color: #6b7280;">${t('错误详情')}</summary>
          <pre style="background: #f3f4f6; padding: 16px; border-radius: 8px; overflow: auto; margin-top: 8px;">${errorText}</pre>
        </details>
      </div>
    </div>
  `;
}
