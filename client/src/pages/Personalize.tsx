import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreativeCanvas } from '../components/personalization/CreativeCanvas';
import { ClickEffects, ThemeMode } from '../components/personalization/ClickEffects';
import { fetchConfig, saveConfig } from '../services/personalizationApi';
import { DraggableWindow } from '../components/personalization/DraggableWindow';
import toast from 'react-hot-toast';
import { UltimatePet } from '../components/UltimatePet';

// 寮曞叆鍔熻兘缁勪欢
// 搴旂敤鍏ュ彛宸茶縼绉诲埌 MagicDock锛岃繖閲屼繚鐣欑┖鍒楄〃浠ュ仠鐢ㄦ棫鍏ュ彛

const APPS: any[] = [];

const isThemeMode = (value: unknown): value is ThemeMode => (
  value === 'macaron' || value === 'cyber' || value === 'forest'
);

const Personalize = () => {
  const [activeApps, setActiveApps] = useState<string[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('macaron');
  const [loading, setLoading] = useState(true);
  
  // 鏍稿績鐘舵侊細浣嶇疆绠＄悊
  const [windowPositions, setWindowPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [dockPos, setDockPos] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight - 100 });

  // 1. 鍒濆嬪寲鏁版嵁鍔犺?  useEffect(() => {
  useEffect(() => {
    const load = async () => {
        try {
            const data = await fetchConfig();
            if (data) {
                if (isThemeMode(data.theme)) setTheme(data.theme);
                setActiveApps([]); // 鍏ュ彛宸茬Щ鍒?MagicDock
                
                // 鎭㈠嶇獥鍙ｄ綅缃
                if (data.layout?.windows) {
                    setWindowPositions(data.layout.windows);
                }
                // 鎭㈠ Dock 浣嶇疆
                if (data.layout?.dock && data.layout.dock.x !== 500) { // 绠鍗曡繃婊ら粯璁ゅ?
                    setDockPos(data.layout.dock);
                }
            }
        } catch (e) {
            console.error("鍔犺浇閰嶇疆澶辫触", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, []);

  // 淇濆瓨绐楀彛浣嶇疆
  const handleWindowSave = (id: string, pos: { x: number, y: number }) => {
      // 鏇存柊鏈鍦扮姸鎬侊紝闃叉UI璺冲彉锛堝彲閫夛級
      // setWindowPositions(prev => ({ ...prev, [id]: pos }));
      
      // 鍙戦佺粰鍚庣
      saveConfig({ 
          layout: { 
              windows: { [id]: pos } // controller 浼氬仛娣卞害鍚堝苟
          } 
      });
  };

  // 淇濆瓨 Dock 浣嶇疆
  const handleDockSave = (pos: { x: number, y: number }) => {
      // 淇姝ｏ細淇濆?Dock 涓蹇冪偣鎴栧乏涓婅掞紝杩欓噷鐩存帴淇濆瓨 transform 缁撴灉
      saveConfig({ layout: { dock: pos } });
  };

  const toggleApp = (id: string) => {
    // Legacy entry disabled.
  };

  const cycleTheme = () => {
      const themes: ThemeMode[] = ['macaron', 'cyber', 'forest'];
      const next = themes[(themes.indexOf(theme) + 1) % themes.length];
      setTheme(next);
      saveConfig({ theme: next });
  };

  const getBg = () => {
      switch(theme) {
          case 'cyber': return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900';
          case 'forest': return 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-100 via-emerald-50 to-teal-50';
          default: return 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-100 via-purple-50 to-blue-50';
      }
  };

  const getDockColor = () => {
      switch(theme) {
          case 'cyber': return 'bg-black/60 border-cyan-500/50 shadow-cyan-500/20';
          case 'forest': return 'bg-white/80 border-emerald-500/30 shadow-emerald-500/10';
          default: return 'bg-white/70 border-white/50 shadow-pink-500/10';
      }
  };

  if (loading) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center bg-transparent animate-pulse"
        style={{ color: 'var(--text-muted)' }}
      >
        姝ｅ湪杩涘叆浣犵殑涓撳睘绌洪棿...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-64px)] overflow-hidden bg-transparent font-sans select-none">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'var(--panel-bg, rgba(255,255,255,0.18))' }}
        />
        
        {/* 鐐瑰嚮鐗规晥 & 鑳屾櫙鍒囨崲 */}
        <ClickEffects theme={theme} onDoubleClick={cycleTheme} />

        {/* 鍒涙剰鐢诲竷 (鐓х墖澧? - 鑷鍔ㄨ诲彇鍚庣鏁版嵁 */}
        <CreativeCanvas theme={theme} />

        {/* 涓鎬у寲椤垫覆鏌撳敮涓瀹犵墿瀹炰緥 */}
        <UltimatePet />




        {/* 鎮娴绐楀彛灞?- 鍏ㄩ儴浣跨敤 DraggableWindow 鍖呰 */}
        <AnimatePresence>
            {/* 鏃х獥鍙ｅ叆鍙ｅ凡鍏抽棴锛岀獥鍙ｆ覆鏌撲氦缁?MagicDock */}
        </AnimatePresence>

        {/* 椤堕儴鏍囬 */}
        <div className={`absolute top-0 left-0 w-full p-6 text-center pointer-events-none transition-colors duration-1000 ${theme==='cyber'?'text-white/20':'text-slate-800/20'}`}>
            <h1 className="text-4xl font-black tracking-tighter mix-blend-overlay">MY SPACE OS</h1>
        </div>
    </div>
  );
};

export default Personalize;
