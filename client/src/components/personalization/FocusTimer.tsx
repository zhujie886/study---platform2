import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/i18n/LanguageContext';

export const FocusTimer = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'idle' | 'focus' | 'reward'>('idle');
  const [pet, setPet] = useState<'bunny' | 'puppy'>('bunny');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      // 结束逻辑
      setIsActive(false);
      setMode('reward');
      confetti({ particleCount: 150, spread: 60, origin: { y: 0.7 } });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (!isActive) setMode('focus');
    setIsActive(!isActive);
  };

  const reset = () => {
      setIsActive(false);
      setTimeLeft(duration * 60);
      setMode('idle');
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="w-72 bg-gradient-to-br from-rose-50 to-pink-50 rounded-[30px] shadow-2xl p-6 flex flex-col items-center relative border border-white">
      <button onClick={onClose} className="absolute top-4 right-4 text-pink-300 hover:text-pink-500 transition-colors">×</button>
      
      {/* 萌物互动区 */}
      <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center mb-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] relative overflow-hidden ring-4 ring-pink-100">
         <motion.div
            key={mode}
            animate={mode === 'focus' ? { y: [0, 4, 0] } : mode === 'reward' ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: mode === 'focus' ? 2 : 0.6 }}
            className="text-7xl select-none"
         >
             {pet === 'bunny' ? (
                 mode === 'idle' ? '🐰' : mode === 'focus' ? '🐰' : '🥕'
             ) : (
                 mode === 'idle' ? '🐶' : mode === 'focus' ? '🐶' : '🦴'
             )}
         </motion.div>
         
         {/* 状态气泡 */}
         {mode === 'focus' && (
             <motion.div 
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 right-6 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full"
             >
                 {t('嘘..学习中')}
             </motion.div>
         )}
      </div>

      {/* 计时显示 */}
      <div className="text-5xl font-mono font-bold text-slate-700 mb-6 tracking-wider">
        {format(timeLeft)}
      </div>

      {/* 控制区 */}
      {mode === 'reward' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full">
            <p className="text-pink-600 font-bold mb-1">{t('专注达成！')} <span aria-hidden>🎉</span></p>
            <p className="text-xs text-pink-400 mb-4">{t('获得一颗专注糖果')}</p>
            <button onClick={reset} className="w-full bg-pink-400 text-white py-2 rounded-xl font-bold shadow-md hover:bg-pink-500 hover:scale-105 transition-all">
                {t('开心收下')}
            </button>
        </motion.div>
      ) : (
        <div className="w-full">
            {/* 时间选择滑块 (仅Idle时可用) */}
            {mode === 'idle' && (
                <div className="flex justify-center gap-2 mb-4">
                    {[15, 25, 45].map(m => (
                        <button 
                            key={m} 
                            onClick={() => { setDuration(m); setTimeLeft(m*60); }}
                            className={`text-xs px-3 py-1 rounded-full border ${duration === m ? 'bg-pink-100 border-pink-300 text-pink-600' : 'border-slate-200 text-slate-400'}`}
                        >
                            {t('{count}分钟', { count: m })}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex justify-center gap-4">
                <button 
                    onClick={toggleTimer} 
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95 ${isActive ? 'bg-amber-400' : 'bg-pink-400'}`}
                >
                    {isActive ? <PauseIcon className="w-7 h-7"/> : <PlayIcon className="w-7 h-7 ml-1"/>}
                </button>
                {mode !== 'idle' && (
                    <button onClick={reset} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-md hover:text-red-400 transition-colors">
                        <StopIcon className="w-7 h-7"/>
                    </button>
                )}
            </div>
            
            {/* 切换宠物 */}
            {mode === 'idle' && (
                <button 
                    onClick={() => setPet(p => p === 'bunny' ? 'puppy' : 'bunny')}
                    className="mt-4 w-full text-xs text-slate-400 hover:text-pink-400 underline"
                >
                    {t('切换陪学伙伴: {pet}', { pet: pet === 'bunny' ? t('小白兔') : t('修狗') })}
                </button>
            )}
        </div>
      )}
    </div>
  );
};


