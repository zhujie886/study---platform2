import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/i18n/LanguageContext';



// --- 类型定义 ---

type FortuneLevel = 'best' | 'good' | 'fair' | 'caution' | 'low';

interface FortuneResult {

  level: FortuneLevel;

  titleKey: string;

  poemKey: string;

  themeColor: string;

  glowColor: string;

  bgGradient: string;

  rollIndex: number;

}



// --- 签文数据 ---

const FORTUNE_POOL: Record<FortuneLevel, { titles: string[]; poems: string[]; theme: string; glow: string; bg: string }> = {
  best: {
    titles: ['fortune.pool.best.title1', 'fortune.pool.best.title2'],
    poems: ['fortune.pool.best.poem1'],
    theme: 'text-amber-300',
    glow: 'rgba(251, 191, 36, 0.8)',
    bg: 'from-amber-900/60 via-amber-600/40 to-yellow-900/60',
  },
  good: {
    titles: ['fortune.pool.good.title1', 'fortune.pool.good.title2'],
    poems: ['fortune.pool.good.poem1'],
    theme: 'text-pink-300',
    glow: 'rgba(244, 114, 182, 0.8)',
    bg: 'from-pink-900/60 via-rose-600/40 to-purple-900/60',
  },
  fair: {
    titles: ['fortune.pool.fair.title1', 'fortune.pool.fair.title2'],
    poems: ['fortune.pool.fair.poem1'],
    theme: 'text-blue-300',
    glow: 'rgba(96, 165, 250, 0.8)',
    bg: 'from-blue-900/60 via-cyan-600/40 to-sky-900/60',
  },
  caution: {
    titles: ['fortune.pool.caution.title1', 'fortune.pool.caution.title2'],
    poems: ['fortune.pool.caution.poem1'],
    theme: 'text-indigo-300',
    glow: 'rgba(129, 140, 248, 0.8)',
    bg: 'from-indigo-900/60 via-purple-600/40 to-violet-900/60',
  },
  low: {
    titles: ['fortune.pool.low.title1', 'fortune.pool.low.title2'],
    poems: ['fortune.pool.low.poem1'],
    theme: 'text-slate-300',
    glow: 'rgba(148, 163, 184, 0.8)',
    bg: 'from-slate-900/60 via-gray-600/40 to-zinc-900/60',
  }
};

// --- SVG 组件：梦幻水晶球 ---

const CrystalBallSVG = ({ isShaking }: { isShaking: boolean }) => (

  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]">

    <defs>

      <radialGradient id="ballGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">

        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />

        <stop offset="20%" stopColor="rgba(200, 220, 255, 0.5)" />

        <stop offset="50%" stopColor="rgba(100, 100, 255, 0.3)" />

        <stop offset="90%" stopColor="rgba(50, 20, 100, 0.4)" />

        <stop offset="100%" stopColor="rgba(30, 0, 60, 0.6)" />

      </radialGradient>

      <filter id="glow">

        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>

        <feMerge>

          <feMergeNode in="coloredBlur"/>

          <feMergeNode in="SourceGraphic"/>

        </feMerge>

      </filter>

    </defs>

    

    {/* 内部星云流动效果 */}

    <motion.circle 

      cx="100" cy="100" r="70" 

      fill="url(#ballGradient)" 

      filter="url(#glow)"

      animate={{ 

        scale: isShaking ? [1, 1.05, 1] : 1,

      }}

      transition={{ duration: 0.5, repeat: Infinity }}

    />

    

    {/* 高光反射 */}

    <ellipse cx="70" cy="70" rx="30" ry="20" fill="rgba(255,255,255,0.4)" transform="rotate(-45 70 70)" filter="url(#glow)" />

    

    {/* 内部魔法漩涡 */}

    <motion.g 

      style={{ originX: "100px", originY: "100px" }}

      animate={{ rotate: 360 }}

      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}

    >

      <path d="M100,50 Q130,50 150,100 T100,150 T50,100 T100,50" fill="none" stroke="rgba(255,200,255,0.3)" strokeWidth="2" strokeDasharray="10 20" />

      <path d="M100,60 Q120,60 140,100 T100,140 T60,100 T100,60" fill="none" stroke="rgba(200,255,255,0.2)" strokeWidth="1" strokeDasharray="5 15" />

    </motion.g>

  </svg>

);



// --- SVG 组件：发光小精灵 ---

const FairySVG = ({ isShaking }: { isShaking: boolean }) => (

  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">

    <defs>

      <filter id="fairyGlow">

        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>

        <feMerge>

          <feMergeNode in="coloredBlur"/>

          <feMergeNode in="SourceGraphic"/>

        </feMerge>

      </filter>

    </defs>

    

    <motion.g

      initial={{ y: 0 }}

      animate={isShaking ? 

        { y: [-2, 2, -2], rotate: [-5, 5, -5] } : 

        { y: [-5, 5, -5] }

      }

      transition={isShaking ? 

        { duration: 0.2, repeat: Infinity } : 

        { duration: 3, repeat: Infinity, ease: "easeInOut" }

      }

    >

      {/* 翅膀 (左) */}

      <motion.path 

        d="M45,40 Q20,20 10,40 Q20,60 45,50 Z" 

        fill="rgba(200, 240, 255, 0.8)" 

        stroke="white" 

        strokeWidth="0.5"

        animate={{ scaleX: [1, 0.2, 1], rotate: [0, 10, 0] }}

        transition={{ duration: isShaking ? 0.1 : 0.2, repeat: Infinity }}

        style={{ originX: "45px", originY: "45px" }}

      />

      {/* 翅膀 (右) */}

      <motion.path 

        d="M55,40 Q80,20 90,40 Q80,60 55,50 Z" 

        fill="rgba(200, 240, 255, 0.8)" 

        stroke="white" 

        strokeWidth="0.5"

        animate={{ scaleX: [1, 0.2, 1], rotate: [0, -10, 0] }}

        transition={{ duration: isShaking ? 0.1 : 0.2, repeat: Infinity }}

        style={{ originX: "55px", originY: "45px" }}

      />

      

      {/* 身体光辉 */}

      <circle cx="50" cy="45" r="8" fill="#fff7cd" filter="url(#fairyGlow)" />

      {/* 魔法棒 */}

      <line x1="56" y1="45" x2="70" y2="35" stroke="#fbbf24" strokeWidth="1" />

      <circle cx="70" cy="35" r="2" fill="white" filter="url(#fairyGlow)" />

    </motion.g>

  </svg>

);



// --- 魔法粒子系统 ---

const MagicDust = ({ isShaking }: { isShaking: boolean }) => {

  const particles = Array.from({ length: 30 });

  return (

    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">

      {particles.map((_, i) => {

        const size = Math.random() * 3 + 1;

        const left = Math.random() * 100;

        const duration = Math.random() * 2 + 1.5;

        const delay = Math.random() * 2;

        

        return (

          <motion.div

            key={i}

            className="absolute rounded-full bg-[#fff7cd]"

            style={{

              width: size,

              height: size,

              left: `${left}%`,

              bottom: '-10px',

              boxShadow: `0 0 ${size * 2}px ${size / 2}px rgba(255, 247, 205, 0.6)`

            }}

            animate={{

              y: [0, -280],

              opacity: [0, 1, 0],

              scale: [0, 1.5, 0],

              x: isShaking ? [0, (Math.random() - 0.5) * 30, 0] : 0,

            }}

            transition={{

              duration: duration,

              repeat: Infinity,

              delay: delay,

              ease: "easeOut",

              times: [0, 0.5, 1]

            }}

          />

        );

      })}

    </div>

  );

};



export const FortuneWidget = () => {
  const { t } = useLanguage();

  const [status, setStatus] = useState<'idle' | 'shaking' | 'revealed'>('idle');

  const [result, setResult] = useState<FortuneResult | null>(null);



  const drawFortune = () => {

    if (status !== 'idle') return;

    setStatus('shaking');

    

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 125) + 1;
      let level: FortuneLevel;
      if (roll <= 25) level = 'best';
      else if (roll <= 50) level = 'good';
      else if (roll <= 75) level = 'fair';
      else if (roll <= 100) level = 'caution';
      else level = 'low';

      const data = FORTUNE_POOL[level];
      const titleKey = data.titles[Math.floor(Math.random() * data.titles.length)];
      const poemKey = data.poems[Math.floor(Math.random() * data.poems.length)];

      setResult({
        level,
        titleKey,
        poemKey,
        themeColor: data.theme,
        glowColor: data.glow,
        bgGradient: data.bg,
        rollIndex: roll
      });
      setStatus('revealed');
    }, 3000);

  };



  const reset = (e: React.MouseEvent) => {

    e.stopPropagation();

    setResult(null);

    setStatus('idle');

  };



  return (

    <div className="w-72 relative group select-none font-sans">

      {/* 外部环境光 */}

      <div className="absolute -inset-4 bg-gradient-to-t from-purple-900/40 via-blue-900/20 to-transparent rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition duration-700"></div>

      

      {/* 核心容器 */}

      <div className="relative bg-[#0f0c29]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col items-center p-6">

        {/* 背景纹理 */}

        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none bg-gradient-to-tr from-indigo-500/10 to-purple-500/10"></div>

        <MagicDust isShaking={status === 'shaking'} />



        {/* 标题 */}

        <div className="relative z-10 flex items-center gap-2 mb-8">

          <SparklesIcon className="w-4 h-4 text-purple-300/80 animate-pulse" />

          <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 tracking-[0.2em] shadow-sm">{t("fortune.widget.title")}</span>

          <SparklesIcon className="w-4 h-4 text-purple-300/80 animate-pulse" />

        </div>



        <div className="w-full flex flex-col items-center justify-center relative min-h-[220px]">

          <AnimatePresence mode="wait">

            

            {/* --- 状态1：待机 / 摇签中 --- */}

            {status !== 'revealed' && (

              <motion.div

                key="shaking-stage"

                className="relative flex flex-col items-center cursor-pointer"

                onClick={drawFortune}

                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}

              >

                {/* 精灵 SVG */}

                <div className="absolute z-30 -top-16 w-24 h-24 pointer-events-none">

                  <FairySVG isShaking={status === 'shaking'} />

                  {/* 精灵光晕 */}

                  {status === 'shaking' && (

                    <motion.div animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }} transition={{duration: 1, repeat: Infinity}} className="absolute inset-0 bg-yellow-200/30 blur-xl rounded-full -z-10" />

                  )}

                </div>



                {/* 水晶球 SVG */}

                <div className="relative z-20 w-36 h-36">

                   {/* 底部魔法阵光环 */}

                   <motion.div 

                     animate={{ rotate: 360, scale: status === 'shaking' ? [1, 1.1, 1] : 1 }}

                     transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }}

                     className="absolute -bottom-4 -left-4 w-44 h-44 bg-gradient-to-t from-purple-500/20 to-transparent rounded-full blur-md border-2 border-purple-300/10 -z-10 opacity-60"

                     style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}

                   />



                  <div className="w-full h-full relative">

                    <CrystalBallSVG isShaking={status === 'shaking'} />

                  </div>

                </div>



                {/* 提示文字 */}

                <motion.p 

                  className="mt-6 text-xs font-medium text-blue-100/70 tracking-widest"

                  animate={{ opacity: status === 'shaking' ? [0.4, 1, 0.4] : 0.8 }}

                  transition={{ repeat: Infinity, duration: 2 }}

                >

                  {status === "shaking" ? t("fortune.widget.shaking") : t("fortune.widget.touch")}

                </motion.p>

              </motion.div>

            )}



            {/* --- 状态2：结果展示 (命运卡牌) --- */}

            {status === 'revealed' && result && (

              <motion.div

                key="result-stage"

                initial={{ opacity: 0, y: 20, scale: 0.9 }}

                animate={{ opacity: 1, y: 0, scale: 1 }}

                transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.2 }}

                className="relative z-30 w-full"

              >

                {/* 卡牌主体 */}

                <div 

                  className={`relative w-full rounded-2xl p-[1px] overflow-hidden bg-gradient-to-br ${result.bgGradient} shadow-2xl`}

                  style={{ boxShadow: `0 10px 30px -10px ${result.glowColor}` }}

                >

                  {/* 卡牌内部 */}

                  <div className="relative bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 flex flex-col items-center text-center border border-white/10">

                    

                    <div className="absolute top-3 right-3 text-[10px] font-mono text-white/40 border border-white/10 px-1.5 py-0.5 rounded-md">

                      NO.{String(result.rollIndex).padStart(3, '0')}

                    </div>



                    <motion.h3 

                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }}

                      className={`text-3xl font-black ${result.themeColor} mb-2 font-serif tracking-wider filter drop-shadow-sm`}

                    >

                      {t(`fortune.level.${result.level}`)}

                    </motion.h3>

                    

                    <div className="flex items-center gap-2 opacity-50 mb-4">

                      <div className={`h-[1px] w-8 bg-current ${result.themeColor}`}></div>

                      <div className={`w-1.5 h-1.5 rounded-full bg-current ${result.themeColor}`}></div>

                      <div className={`h-[1px] w-8 bg-current ${result.themeColor}`}></div>

                    </div>

                    

                    <h4 className="text-sm font-bold text-white/90 mb-3">{t(result.titleKey)}</h4>

                    <p className="text-xs leading-relaxed text-white/70 font-serif italic px-1">&ldquo;{t(result.poemKey)}&rdquo;</p>

                  </div>

                  

                  <motion.div

                    initial={{ x: '-100%', opacity: 0 }}

                    animate={{ x: '200%', opacity: [0, 0.5, 0] }}

                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}

                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 -z-10"

                  />

                </div>



                <motion.button 

                  onClick={reset}

                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}

                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}

                  className="mt-6 mx-auto flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 text-xs text-blue-200/80 hover:text-white hover:bg-white/10 transition-all group/btn border border-white/10"

                >

                  <ArrowPathIcon className="w-3.5 h-3.5 group-hover/btn:-rotate-180 transition-transform duration-700" />

                  <span>{t("fortune.widget.again")}</span>

                </motion.button>

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </div>

    </div>

  );

};



