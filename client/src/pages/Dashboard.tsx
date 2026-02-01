import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useMemoStore } from '@/store/memoStore';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { useLanguage } from '@/i18n/LanguageContext';

function HaloAvatar({
  src,
  frameStyle,
  altText,
}: {
  src?: string | null;
  frameStyle?: React.CSSProperties;
  altText: string;
}) {
  const particles = useMemo(() => {
    const count = 22;
    return Array.from({ length: count }, (_, i) => {
      const a = Math.round((360 / count) * i + (Math.random() * 18 - 9));
      const r = 52 + Math.round(Math.random() * 10);
      const s = 1 + Math.random() * 1.4;
      const b = Math.round(2 + Math.random() * 8);
      const o = 0.25 + Math.random() * 0.65;
      const d = (Math.random() * 1.4).toFixed(2);
      const t = (2.2 + Math.random() * 2.6).toFixed(2);
      return {
        key: `p-${i}`,
        a: `${a}deg`,
        r: `${r}px`,
        s: s.toFixed(2),
        b: `${b}px`,
        o: o.toFixed(2),
        d: `${d}s`,
        t: `${t}s`,
      };
    });
  }, []);

  return (
    <div className="relative group">
      <div className="pointer-events-none absolute -inset-6 rounded-full halo-field">
        {particles.map((p) => (
          <span
            key={p.key}
            className="halo-particle"
            style={
              {
                "--a": p.a,
                "--r": p.r,
                "--s": p.s,
                "--b": p.b,
                "--o": p.o,
                "--d": p.d,
                "--t": p.t,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="pointer-events-none absolute -inset-3 rounded-full halo-ring" />
      <div className="pointer-events-none absolute -inset-2 rounded-full halo-glow" />

      <div
        className="relative w-24 h-24 rounded-full p-[3px] shadow-inner"
        style={frameStyle}
      >
        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center ring-1 ring-white/40 dark:ring-white/10">
          {src ? (
            <img
              src={src}
              alt={altText}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <UserCircleIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { memos, fetchMemos } = useMemoStore();
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customFrame, setCustomFrame] = useState<string>('none');
  const [stats, setStats] = useState({
    totalMemos: 0,
    pendingMemos: 0,
    completedMemos: 0,
    upcomingEvents: 0,
  });
  const { t, lang } = useLanguage();

  const locale = lang === 'zh' ? zhCN : enUS;
  const dateLabel = lang === 'zh'
    ? format(new Date(), 'yyyy年MM月dd日 EEEE', { locale })
    : format(new Date(), 'MMM dd, yyyy EEEE', { locale });

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  useEffect(() => {
    setStats({
      totalMemos: memos.length,
      pendingMemos: memos.filter((m) => m.status === 'pending').length,
      completedMemos: memos.filter((m) => m.status === 'completed').length,
      upcomingEvents: 0,
    });
  }, [memos]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('dashboard_custom_avatar');
    const savedFrame = localStorage.getItem('dashboard_custom_frame');
    if (savedAvatar) setCustomAvatar(savedAvatar);
    if (savedFrame) setCustomFrame(savedFrame);
  }, []);

  const frames = useMemo(() => (
    [
      { id: 'none', name: t('无边框'), style: { border: '2px solid rgba(17,24,39,0.08)' } },
      { id: 'gold', name: t('金色'), style: { border: '3px solid #f59e0b', boxShadow: '0 0 12px #fbbf24' } },
      { id: 'pink', name: t('樱粉'), style: { border: '3px solid #f472b6', boxShadow: '0 0 12px #f472b6' } },
      { id: 'blue', name: t('霓虹'), style: { border: '3px solid #38bdf8', boxShadow: '0 0 12px #38bdf8' } },
      { id: 'green', name: t('薄荷'), style: { border: '3px solid #22c55e', boxShadow: '0 0 12px #22c55e' } },
    ]
  ), [t]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCustomAvatar(result);
      localStorage.setItem('dashboard_custom_avatar', result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClear = () => {
    setCustomAvatar(null);
    localStorage.removeItem('dashboard_custom_avatar');
  };

  const handleFrameSelect = (id: string) => {
    setCustomFrame(id);
    localStorage.setItem('dashboard_custom_frame', id);
  };

  const currentFrameStyle = frames.find((f: any) => f.id === customFrame)?.style;
  const recentMemos = memos.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('nav.dashboard')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('总备忘录')}
          value={stats.totalMemos}
          icon={DocumentTextIcon}
          color="primary"
          link="/memos"
        />
        <StatCard
          title={t('待处理')}
          value={stats.pendingMemos}
          icon={ClockIcon}
          color="yellow"
          link="/memos?status=pending"
        />
        <StatCard
          title={t('已完成')}
          value={stats.completedMemos}
          icon={ChartBarIcon}
          color="green"
          link="/memos?status=completed"
        />
        <StatCard
          title={t('即将到来')}
          value={stats.upcomingEvents}
          icon={CalendarIcon}
          color="blue"
          link="/calendar"
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl glass-card">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 18%, transparent)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 12%, transparent)' }}
        />

        <div className="relative p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl soft-tile shadow-sm">
                <PhotoIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  {t('个性化角')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('与你的「个性化」页面联动，头像与边框保持一致')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/personalize')}
                className="px-4 py-2 rounded-xl btn-soft text-sm font-semibold"
              >
                {t('前往个性化')}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex items-center gap-5">
              <HaloAvatar src={customAvatar} frameStyle={currentFrameStyle} altText={t('头像')} />
              <div className="min-w-[220px]">
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                  {t('选择喜欢的头像和边框，保存在本地')}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="dashboard-avatar-upload"
                    className="px-3 py-1.5 rounded-lg bg-white/80 text-gray-700 text-xs font-semibold shadow-sm border border-gray-200 hover:bg-white transition"
                  >
                    {t('上传头像')}
                  </label>
                  {customAvatar && (
                    <button
                      onClick={handleAvatarClear}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 hover:bg-gray-200 transition"
                    >
                      {t('清除头像')}
                    </button>
                  )}
                  <input
                    id="dashboard-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_0_4px_rgba(52,211,153,0.18)] dark:shadow-[0_0_0_4px_rgba(52,211,153,0.1)]" />
                  {t('光晕为粒子层叠动画（非单圈），更细腻更“活”')}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <PaintBrushIcon className="w-4 h-4" />
                {t('边框')}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {frames.map((frame: any) => {
                  const active = customFrame === frame.id;
                  return (
                    <button
                      key={frame.id}
                      onClick={() => handleFrameSelect(frame.id)}
                      className={[
                        'group relative p-3 rounded-2xl border text-sm transition-all',
                        'bg-white/70 hover:bg-white shadow-sm hover:shadow-md',
                        'dark:bg-gray-800/50 dark:hover:bg-gray-700/80',
                        active
                          ? 'border-primary-300 ring-2 ring-primary-100 dark:border-primary-500 dark:ring-primary-900/50'
                          : 'border-gray-200 hover:border-primary-200 dark:border-gray-700 dark:hover:border-primary-500/50',
                      ].join(' ')}
                    >
                      <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 grid place-items-center">
                        <div
                          className={[
                            'w-12 h-12 rounded-full',
                            active ? 'scale-[1.02]' : 'group-hover:scale-[1.02]',
                            'transition-transform',
                          ].join(' ')}
                          style={frame.style as any}
                        />
                      </div>
                      <div
                        className={[
                          'text-center font-medium',
                          active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300',
                        ].join(' ')}
                      >
                        {frame.name}
                      </div>

                      {active && (
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-primary-50/60 to-transparent dark:from-primary-900/20" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <style>{`
        .halo-glow{
          background: radial-gradient(circle at 50% 50%,
            rgba(236,72,153,0.28) 0%,
            rgba(236,72,153,0.10) 35%,
            rgba(236,72,153,0.00) 70%);
          filter: blur(10px);
          opacity: 0.95;
          transition: opacity .25s ease;
        }

        .halo-ring{
          background:
            conic-gradient(from 180deg,
              rgba(236,72,153,0.00),
              rgba(236,72,153,0.45),
              rgba(255,255,255,0.35),
              rgba(236,72,153,0.18),
              rgba(236,72,153,0.00));
          -webkit-mask: radial-gradient(circle,
            transparent 54%,
            rgba(0,0,0,1) 58%,
            rgba(0,0,0,1) 68%,
            transparent 72%);
          mask: radial-gradient(circle,
            transparent 54%,
            rgba(0,0,0,1) 58%,
            rgba(0,0,0,1) 68%,
            transparent 72%);
          filter: blur(1.2px);
          animation: haloSpin 6s linear infinite;
          opacity: 0.9;
        }

        .halo-field{
          filter: blur(0.2px);
        }

        .halo-particle{
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          transform: rotate(var(--a)) translateX(var(--r)) scale(var(--s));
          transform-origin: 0 0;
          opacity: var(--o);
          background: radial-gradient(circle at 30% 30%,
            rgba(255,255,255,0.95) 0%,
            rgba(236,72,153,0.65) 35%,
            rgba(236,72,153,0.10) 70%,
            rgba(236,72,153,0.00) 100%);
          filter: blur(var(--b));
          animation:
            particleTwinkle var(--t) ease-in-out infinite,
            particleDrift calc(var(--t) + 2s) ease-in-out infinite;
          animation-delay: var(--d);
        }

        .group:hover .halo-glow{
          opacity: 1;
        }
        .group:hover .halo-ring{
          opacity: 1;
          filter: blur(0.9px);
        }

        @keyframes haloSpin{
          from{ transform: rotate(0deg); }
          to{ transform: rotate(360deg); }
        }

        @keyframes particleTwinkle{
          0%,100%{
            opacity: calc(var(--o) * 0.45);
            transform: rotate(var(--a)) translateX(var(--r)) scale(calc(var(--s) * 0.75));
          }
          50%{
            opacity: calc(var(--o) * 1.15);
            transform: rotate(var(--a)) translateX(calc(var(--r) + 6px)) scale(calc(var(--s) * 1.15));
          }
        }

        @keyframes particleDrift{
          0%,100%{
            filter: blur(var(--b));
          }
          50%{
            filter: blur(calc(var(--b) * 0.6));
          }
        }
      `}</style>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('最近备忘录')}</h2>
          <Link
            to="/memos"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            {t('查看全部 →')}
          </Link>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentMemos.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p>{t('还没有备忘录')}</p>
              <Link
                to="/memos"
                className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500"
              >
                {t('创建第一个备忘录')}
              </Link>
            </div>
          ) : (
            recentMemos.map((memo) => (
              <Link
                key={memo.id}
                to="/memos"
                aria-label={t('打开备忘录列表: {title}', { title: memo.title })}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{memo.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {memo.content?.replace(/<[^>]*>/g, '') || t('暂无内容')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {Array.isArray(memo.labels) && memo.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300"
                        >
                          {label}
                        </span>
                      ))}
                      {memo.status && <StatusBadge status={memo.status} />}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                    {format(new Date(memo.updatedAt), 'MM/dd HH:mm')}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title={t('创建备忘录')}
          description={t('记录新的想法和任务')}
          icon={DocumentTextIcon}
          link="/memos"
        />
        <QuickActionCard
          title={t('查看日历')}
          description={t('管理您的日程安排')}
          icon={CalendarIcon}
          link="/calendar"
        />
        <QuickActionCard
          title={t('时间规划')}
          description={t('优化时间利用率')}
          icon={ClockIcon}
          link="/timeline"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, link }: any) {
  const colorClasses = {
    primary: 'soft-tile text-[var(--primary-color)]',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };

  const cardContent = (
    <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="hover:shadow-lg transition-shadow rounded-lg block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

function QuickActionCard({ title, description, icon: Icon, link }: any) {
  return (
    <Link
      to={link}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border dark:border-gray-700 block"
    >
      <Icon className="w-8 h-8 text-primary-600 mb-3 dark:text-primary-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">{description}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const statusConfig = {
    pending: { label: t('待处理'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
    in_progress: { label: t('进行中'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    completed: { label: t('已完成'), color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status || t('未知'),
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}>
      {config.label}
    </span>
  );
}
