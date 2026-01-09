import React from 'react';

import { useTheme } from '../hooks/useTheme';



export default function ThemeBackground() {

  const { styleMode, theme } = useTheme();

  const t = theme.toLowerCase();

  const simpleGlow = (
    <>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'linear-gradient(120deg, var(--theme-aurora-1) 0%, var(--theme-aurora-2) 45%, var(--theme-aurora-3) 100%)',
        }}
      />
      <div
        className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[120px] opacity-50"
        style={{ backgroundColor: 'var(--theme-glow-1)' }}
      />
      <div
        className="absolute top-[10%] right-[-15%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-40"
        style={{ backgroundColor: 'var(--theme-glow-2)' }}
      />
      <div
        className="absolute bottom-[-20%] left-[15%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-40"
        style={{ backgroundColor: 'var(--theme-glow-3)' }}
      />
    </>
  );

  const richGlow = (
    <>
      <div
        className="absolute inset-0 opacity-75"
        style={{
          background:
            'linear-gradient(120deg, var(--theme-aurora-1) 0%, var(--theme-aurora-2) 45%, var(--theme-aurora-3) 100%)',
        }}
      />
      <div
        className="absolute -top-[15%] -left-[12%] w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-60 mix-blend-screen animate-float"
        style={{ backgroundColor: 'var(--theme-glow-1)' }}
      />
      <div
        className="absolute top-[5%] right-[-10%] w-[52vw] h-[52vw] rounded-full blur-[130px] opacity-50 mix-blend-screen"
        style={{ backgroundColor: 'var(--theme-glow-2)' }}
      />
      <div
        className="absolute bottom-[-25%] left-[18%] w-[70vw] h-[70vw] rounded-full blur-[160px] opacity-40 mix-blend-screen animate-pulse-slow"
        style={{ backgroundColor: 'var(--theme-glow-3)' }}
      />
    </>
  );

  const cinemaTone = styleMode === 'simple' ? 'light' : 'dark';

  const cinemaOverlay = (tone: 'light' | 'dark') => {
    const isLight = tone === 'light';

    return (
      <>
        <div
          className="absolute inset-0 mix-blend-soft-light"
          style={{
            opacity: isLight ? 0.28 : 0.45,
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 45%, rgba(255,195,145,0.24) 75%, rgba(255,255,255,0) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: isLight ? 0.08 : 0.14,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: isLight ? 0.18 : 0.42,
            background:
              'radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)',
          }}
        />
        <div
          className="absolute -top-[25%] left-[25%] w-[70vw] h-[70vw] blur-[200px] mix-blend-screen"
          style={{
            opacity: isLight ? 0.2 : 0.3,
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 60%)',
          }}
        />
      </>
    );
  };

  

  if (styleMode === 'simple') {

    return (

      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
        <div
          className="absolute inset-0 transition-colors duration-700 ease-in-out"
          style={{ background: 'var(--background-main)' }}
        />
        {simpleGlow}
        {cinemaOverlay(cinemaTone)}
      </div>

    );

  }



  // === ??? Greek: 古希腊神庙 (大理石+圣光) ===

  if (t.includes('greek')) {

    return (

      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#e5e5e5]">

        {/* 大理石纹理底色 */}

        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f4] via-[#e7e5e4] to-[#d6d3d1]" />

        {richGlow}

        {/* 顶部圣光 */}

        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[100vw] h-[60vw] bg-yellow-100 blur-[120px] opacity-40" />

        {/* 底部阴影 */}

        <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-stone-400/20 to-transparent" />

        {cinemaOverlay(cinemaTone)}

      </div>

    );

  }



  // === ??? Monet: 睡莲池 (印象派) ===

  if (t.includes('monet')) {

    return (

      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#f0fdfa]">

        {/* 蓝绿紫混色 */}

        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-blue-100 to-purple-200 opacity-80" />

        {richGlow}

        {/* 光斑 */}

        <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] bg-green-200 rounded-full blur-[100px] opacity-30 animate-pulse-slow" />

        <div className="absolute bottom-[10%] right-[10%] w-[60vw] h-[60vw] bg-indigo-200 rounded-full blur-[100px] opacity-30 animate-float" />

        <style>{`.animate-float { animation: float 15s infinite ease-in-out; } @keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5%,-5%)} }`}</style>

        {cinemaOverlay(cinemaTone)}

      </div>

    );

  }



  // === ?? Klimt: 金色奢华 (黑金) ===

  if (t.includes('klimt')) {

    return (

      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#000]">

        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1917] to-[#000000]" />

        {richGlow}

        {/* 金色几何装饰 */}

        <div className="absolute top-0 right-0 w-[50vw] h-[100vh] bg-gradient-to-l from-yellow-600/10 to-transparent" />

        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {cinemaOverlay(cinemaTone)}

      </div>

    );

  }



  // === ?? Sakura ===

  if (t.includes('sakura')) {

     return (

      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#fff0f5]">

        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 opacity-70" />

        {richGlow}

        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-pink-300 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />

        <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-rose-200 rounded-full blur-[150px] opacity-30" />

        {cinemaOverlay(cinemaTone)}

      </div>

     );

  }



  // === ?? Van Gogh ===

  if (t.includes('van gogh')) {

    return (

      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#020617]">

        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-[#0f172a]" />

        {richGlow}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] opacity-50 animate-spin-slow">

            <div className="w-full h-full rounded-full mix-blend-screen" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(29,78,216,0.6) 40%, transparent 70%)' }} />

        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] opacity-30 animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, transparent, #1e3a8a, transparent, #fbbf24, transparent)' }} />

        <style>{`.animate-spin-slow { animation: spin 120s linear infinite; }`}</style>

        {cinemaOverlay(cinemaTone)}

      </div>

    );

  }



  // === 通用 ===

  return (

    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">

      <div className="absolute inset-0 transition-all duration-1000" style={{ background: 'var(--background-main)' }} />

      {richGlow}
      {cinemaOverlay(cinemaTone)}

    </div>

  );

}





