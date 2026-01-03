import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeBackground() {
  const { styleMode, theme } = useTheme();
  const t = theme.toLowerCase();
  
  if (styleMode === 'simple') {
    return (
      <div 
        className="fixed inset-0 -z-50 transition-colors duration-500 ease-in-out"
        style={{ backgroundColor: 'var(--background-main)' }}
      />
    );
  }

  // === ??? Greek: 古希腊神庙 (大理石+圣光) ===
  if (t.includes('greek')) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#e5e5e5]">
        {/* 大理石纹理底色 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f4] via-[#e7e5e4] to-[#d6d3d1]" />
        {/* 顶部圣光 */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[100vw] h-[60vw] bg-yellow-100 blur-[120px] opacity-40" />
        {/* 底部阴影 */}
        <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-stone-400/20 to-transparent" />
      </div>
    );
  }

  // === ??? Monet: 睡莲池 (印象派) ===
  if (t.includes('monet')) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#f0fdfa]">
        {/* 蓝绿紫混色 */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 via-blue-100 to-purple-200 opacity-80" />
        {/* 光斑 */}
        <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] bg-green-200 rounded-full blur-[100px] opacity-30 animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[60vw] h-[60vw] bg-indigo-200 rounded-full blur-[100px] opacity-30 animate-float" />
        <style>{`.animate-float { animation: float 15s infinite ease-in-out; } @keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5%,-5%)} }`}</style>
      </div>
    );
  }

  // === ?? Klimt: 金色奢华 (黑金) ===
  if (t.includes('klimt')) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#000]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1917] to-[#000000]" />
        {/* 金色几何装饰 */}
        <div className="absolute top-0 right-0 w-[50vw] h-[100vh] bg-gradient-to-l from-yellow-600/10 to-transparent" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    );
  }

  // === ?? Sakura ===
  if (t.includes('sakura')) {
     return (
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#fff0f5]">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 opacity-70" />
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-pink-300 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-rose-200 rounded-full blur-[150px] opacity-30" />
        <style>{`.animate-pulse-slow { animation: pulse 8s infinite ease-in-out; }`}</style>
      </div>
     );
  }

  // === ?? Van Gogh ===
  if (t.includes('van gogh')) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#020617]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-[#0f172a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] opacity-50 animate-spin-slow">
            <div className="w-full h-full rounded-full mix-blend-screen" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(29,78,216,0.6) 40%, transparent 70%)' }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] opacity-30 animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, transparent, #1e3a8a, transparent, #fbbf24, transparent)' }} />
        <style>{`.animate-spin-slow { animation: spin 120s linear infinite; }`}</style>
      </div>
    );
  }

  // === 通用 ===
  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
      <div className="absolute inset-0 transition-all duration-1000" style={{ background: 'var(--background-main)' }} />
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full mix-blend-screen opacity-20 blur-[100px] animate-pulse-slow" style={{ backgroundColor: 'var(--primary-color)' }} />
    </div>
  );
}


