import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreativeCanvas } from '../components/personalization/CreativeCanvas';
import { ClickEffects, ThemeMode } from '../components/personalization/ClickEffects';
import { fetchConfig, saveConfig } from '../services/personalizationApi';
import { DraggableWindow } from '../components/personalization/DraggableWindow';
import toast from 'react-hot-toast';
import { UltimatePet } from '../components/UltimatePet';

// 引入功能组件
// 应用入口已迁移到 MagicDock，这里保留空列表以停用旧入口

const APPS: any[] = [];

const isThemeMode = (value: unknown): value is ThemeMode => (
  value === 'macaron' || value === 'cyber' || value === 'forest'
);

const Personalize = () => {
  const [activeApps, setActiveApps] = useState<string[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('macaron');
  const [loading, setLoading] = useState(true);
  
  // 核心状态：位置管理
  const [windowPositions, setWindowPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [dockPos, setDockPos] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight - 100 });

  // 1. 初始化数据加�?  useEffect(() => {
  useEffect(() => {
    const load = async () => {
        try {
            const data = await fetchConfig();
            if (data) {
                if (isThemeMode(data.theme)) setTheme(data.theme);
                setActiveApps([]); // 入口已移�?MagicDock
                
                // 恢复窗口位置
                if (data.layout?.windows) {
                    setWindowPositions(data.layout.windows);
                }
                // 恢复 Dock 位置
                if (data.layout?.dock && data.layout.dock.x !== 500) { // 简单过滤默认�?
                    setDockPos(data.layout.dock);
                }
            }
        } catch (e) {
            console.error("加载配置失败", e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, []);

  // 保存窗口位置
  const handleWindowSave = (id: string, pos: { x: number, y: number }) => {
      // 更新本地状态，防止UI跳变（可选）
      // setWindowPositions(prev => ({ ...prev, [id]: pos }));
      
      // 发送给后端
      saveConfig({ 
          layout: { 
              windows: { [id]: pos } // controller 会做深度合并
          } 
      });
  };

  // 保存 Dock 位置
  const handleDockSave = (pos: { x: number, y: number }) => {
      // 修正：保�?Dock 中心点或左上角，这里直接保存 transform 结果
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
        正在进入你的专属空间...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-64px)] overflow-hidden bg-transparent font-sans select-none">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'var(--panel-bg, rgba(255,255,255,0.18))' }}
        />
        
        {/* 点击特效 & 背景切换 */}
        <ClickEffects theme={theme} onDoubleClick={cycleTheme} />

        {/* 创意画布 (照片�? - 自动读取后端数据 */}
        <CreativeCanvas theme={theme} />

        {/* 个性化页渲染唯一宠物实例 */}
        <UltimatePet />




        {/* 悬浮窗口�?- 全部使用 DraggableWindow 包装 */}
        <AnimatePresence>
            {/* 旧窗口入口已关闭，窗口渲染交�?MagicDock */}
        </AnimatePresence>

        {/* 顶部标题 */}
        <div className={`absolute top-0 left-0 w-full p-6 text-center pointer-events-none transition-colors duration-1000 ${theme==='cyber'?'text-white/20':'text-slate-800/20'}`}>
            <h1 className="text-4xl font-black tracking-tighter mix-blend-overlay">MY SPACE OS</h1>
        </div>
    </div>
  );
};

export default Personalize;
