import { useEffect, useMemo, useRef, useState } from 'react';
import SmartAvatar from './Cosmetics/SmartAvatar';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { StarIcon, UserCircleIcon, ArrowRightOnRectangleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/i18n/LanguageContext';
import { themes } from '@/themes';

export default function FloatingHub() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, styleMode, setTheme, setStyleMode } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customFrame, setCustomFrame] = useState<string>('none');

  const [snapSide, setSnapSide] = useState<'left' | 'right'>('right');
  const [verticalPos, setVerticalPos] = useState<'top' | 'bottom'>('bottom');

  const constraintsRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  const margin = 20;
  const size = 76;

  const initialX = typeof window !== 'undefined' ? window.innerWidth - size - margin : 0;
  const initialY = typeof window !== 'undefined' ? window.innerHeight - size - margin * 4 : 0;

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);

  const filteredThemes = useMemo(() => themes.filter((t) => t.type === (styleMode === 'fancy' ? 'gorgeous' : 'simple')), [styleMode]);

  const frames = [
    { id: 'none', name: '无边框', style: { border: '2px solid rgba(255,255,255,0.3)' } },
    { id: 'gold', name: '金色', style: { border: '3px solid #f59e0b', boxShadow: '0 0 10px #fbbf24' } },
    { id: 'pink', name: '樱粉', style: { border: '3px solid #f472b6', boxShadow: '0 0 10px #f472b6' } },
    { id: 'blue', name: '霓虹', style: { border: '3px solid #38bdf8', boxShadow: '0 0 10px #38bdf8' } },
    { id: 'green', name: '薄荷', style: { border: '3px solid #22c55e', boxShadow: '0 0 10px #22c55e' } },
  ];

  const snapToEdge = () => {
    if (!constraintsRef.current) return;
    const bounds = constraintsRef.current.getBoundingClientRect();
    const currentX = x.get();
    const currentY = y.get();
    const vw = bounds.width;
    const vh = bounds.height;

    const isLeft = currentX + size / 2 < vw / 2;
    const targetX = isLeft ? margin : vw - size - margin;
    const clampedY = Math.min(Math.max(currentY, margin), vh - size - margin);
    const isTop = clampedY < vh / 2;

    setSnapSide(isLeft ? 'left' : 'right');
    setVerticalPos(isTop ? 'top' : 'bottom');

    x.set(targetX);
    y.set(clampedY);
  };

  useEffect(() => {
    const handleResize = () => snapToEdge();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && hubRef.current && !hubRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_custom_avatar') || localStorage.getItem('dashboard_custom_avatar');
    const savedFrame = localStorage.getItem('user_custom_frame') || localStorage.getItem('dashboard_custom_frame');
    if (savedAvatar) setCustomAvatar(savedAvatar);
    if (savedFrame) setCustomFrame(savedFrame);
  }, []);
  const quickLinks = [
    { label: t('nav.dashboard'), path: '/' },
    { label: t('nav.community'), path: '/community' },
    { label: t('nav.social'), path: '/social' },
    { label: t('nav.calendar'), path: '/calendar' },
    { label: t('nav.personalize'), path: '/personalize' },
  ];


  const getPanelStyle = () => {
    const style: React.CSSProperties = {
      position: 'absolute',
      width: '320px',
      maxHeight: '550px',
      background: 'var(--panel-bg, rgba(255,255,255,0.95))',
      borderColor: 'var(--panel-border, rgba(255,255,255,0.2))',
      boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
      zIndex: 60,
    };

    if (snapSide === 'left') {
      style.left = size + 16;
      style.transformOrigin = 'left center';
    } else {
      style.right = size + 16;
      style.transformOrigin = 'right center';
    }

    if (verticalPos === 'top') {
      style.top = 0;
      style.transformOrigin += ' top';
    } else {
      style.bottom = 0;
      style.transformOrigin += ' bottom';
    }

    return style;
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <motion.div
        ref={hubRef}
        className="pointer-events-auto absolute"
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragEnd={snapToEdge}
        style={{ x, y, width: size, height: size }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-full rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            border: '3px solid rgba(255,255,255,0.5)'
          }}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          {styleMode === 'fancy' ? (
             <SparklesIcon className="w-10 h-10 text-white animate-pulse" />
          ) : (
             <StarIcon className="w-10 h-10 text-white" />
          )}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="rounded-3xl border backdrop-blur-xl flex flex-col overflow-hidden"
              style={getPanelStyle()}
            >
              <div className="p-5 border-b border-gray-100/10 flex items-center gap-3 bg-gradient-to-r from-white/10 to-transparent">
                <button
                  onClick={() => { navigate('/personalize'); setIsOpen(false); }}
                  className="w-14 h-14 rounded-full overflow-hidden bg-white/10 flex items-center justify-center ring-2 ring-[var(--accent-color)]"
                  style={frames.find((f) => f.id === customFrame)?.style}
                  title={t('hub.gotoPersonalize')}
                >
                  {customAvatar || user?.avatar ? (
                    <SmartAvatar src={customAvatar || user?.avatar || ""} className="w-full h-full object-cover" size={56} />
                  ) : (
                    <UserCircleIcon className="w-10 h-10 text-white/80" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg text-[var(--text-main)] truncate">{user?.username || t('hub.guest')}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{user?.email || t('hub.noEmail')}</div>
                </div>
                <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full text-[var(--text-main)]">
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[420px] custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {quickLinks.map(link => (
                    <button
                      key={link.path}
                      onClick={() => { navigate(link.path); setIsOpen(false); }}
                      className="text-sm py-3 px-4 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-main)] transition-all text-left font-medium border border-transparent hover:border-white/10"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="bg-black/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hub.themeStyle')}</span>
                    <div className="flex gap-1 bg-black/10 rounded-lg p-1">
                      {['simple', 'fancy'].map(m => (
                        <button
                          key={m}
                          onClick={() => setStyleMode(m as any)}
                          className={`text-[10px] px-3 py-1.5 rounded-md transition-all ${styleMode === m ? 'bg-white text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                          {m === 'simple' ? t('hub.simple') : t('hub.fancy')}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {filteredThemes.map(t => (
                      <button
                        key={t.name}
                        onClick={() => setTheme(t.name)}
                        className={`text-[10px] py-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all
                          ${theme === t.name 
                            ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--text-main)] ring-1 ring-[var(--primary-color)]' 
                            : 'border-transparent hover:bg-white/5 text-[var(--text-muted)]'
                          }`}
                      >
                        <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: t.styles['--primary-color'] }} />
                        <span className="truncate w-full text-center px-1">{t.name.split(' · ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-black/5 rounded-2xl p-4 border border-white/5 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('hub.language')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLang('zh')}
                      className={`text-[11px] px-3 py-2 rounded-xl border transition-all ${
                        lang === 'zh'
                          ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--text-main)]'
                          : 'border-transparent hover:bg-white/5 text-[var(--text-muted)]'
                      }`}
                    >
                      {t('hub.langZh')}
                    </button>
                    <button
                      onClick={() => setLang('en')}
                      className={`text-[11px] px-3 py-2 rounded-xl border transition-all ${
                        lang === 'en'
                          ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--text-main)]'
                          : 'border-transparent hover:bg-white/5 text-[var(--text-muted)]'
                      }`}
                    >
                      {t('hub.langEn')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}


