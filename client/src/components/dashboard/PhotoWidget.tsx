import React, { useState, useEffect, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

export const PhotoWidget: React.FC = () => {
  // --- 新增：拖拽逻辑 ---
  const [pos, setPos] = useState({ x: 100, y: 100 }); // 默认位置
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const handleUp = () => { isDragging.current = false; };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // 阻止事件冒泡，防止触发底层的点击
    e.stopPropagation();
    isDragging.current = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  // --- 结束 ---

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed', // 或者是 absolute，取决于父容器
        left: pos.x,
        top: pos.y,
        zIndex: 50,
        cursor: 'move',
        userSelect: 'none'
      }}
      className="photo-widget-container group"
    >
      {/* 模拟相框样式 */}
      <div className="w-48 h-64 bg-white p-3 shadow-xl rotate-2 hover:rotate-0 transition-transform duration-300">
        <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden mb-2">
            <PhotoIcon className="w-8 h-8 text-slate-300" />
            {/* 这里放原本的 <img /> */}
        </div>
        <div className="text-center font-handwriting text-slate-500 text-sm">
          美好时刻
        </div>
      </div>
    </div>
  );
};


