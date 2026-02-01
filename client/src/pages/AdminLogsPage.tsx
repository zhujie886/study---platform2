import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../services/api';
import { useLanguage } from '@/i18n/LanguageContext';

type LogType = 'out' | 'err';

export default function AdminLogsPage() {
  const [type, setType] = useState<LogType>('out');
  const [lines, setLines] = useState<number>(200);
  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { t } = useLanguage();

  const params = useMemo(() => ({ type, lines }), [type, lines]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.logs(params);
      const data = res?.data ?? {};
      setContent((data?.content ?? '') as string);
    } catch (e: any) {
      setError(e?.message ?? t('加载日志失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, lines]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('系统日志')}</h1>
          <p className="text-sm text-gray-600">
            {t('仅管理员可见。默认读取 logs/out.log 或 logs/err.log（可用 LOG_DIR 自定义目录）。')}
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? t('刷新中...') : t('刷新')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-gray-700">
          {t('日志类型')}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LogType)}
            className="ml-2 px-3 py-2 border rounded-lg bg-white"
          >
            <option value="out">out.log</option>
            <option value="err">err.log</option>
          </select>
        </label>

        <label className="text-sm text-gray-700">
          {t('行数')}
          <input
            type="number"
            min={50}
            max={2000}
            value={lines}
            onChange={(e) => setLines(Number(e.target.value || 200))}
            className="ml-2 w-28 px-3 py-2 border rounded-lg bg-white"
          />
        </label>
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mb-4">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-2 border-b bg-gray-50 text-sm text-gray-700">
          {type === 'out' ? 'stdout' : 'stderr'}
        </div>
        <pre className="p-4 text-xs leading-relaxed overflow-auto max-h-[70vh] whitespace-pre-wrap">
{content || t('（暂无日志内容 / 文件不存在）')}
        </pre>
      </div>
    </div>
  );
}
