
import React from 'react';
import { motion } from 'framer-motion';

interface WindowProps {
  id: string;
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  onSave: (id: string, pos: { x: number, y: number }) => void;
  zIndex?: number;
}

export const DraggableWindow = ({ id, children, initialX, initialY, onSave, zIndex = 50 }: WindowProps) => {
  return (
    <motion.div
      drag
      dragMomentum={false} // 关闭惯性，防止滑得太远
      // 使用 initial 直接设置初始位置，而不是 style
      initial={{ x: initialX, y: initialY, scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
      // 拖拽结束时，获取最终的 transform 值并保存
      onDragEnd={(event, info) => {
        // Framer Motion 的 drag 是基于 transform 的偏移量
        // 如果我们用 initial={{x, y}}，那么 info.point 是屏幕绝对坐标
        // 我们需要保存的是相对于父容器的坐标，但在全屏 fixed 布局下，point 就是准确的
        
        // 注意：这里我们保存的是绝对坐标
        // 为了防止下次加载时位置跳变，我们直接保存这个坐标
        onSave(id, { x: info.point.x, y: info.point.y });
      }}
      className="fixed drop-shadow-2xl"
      style={{ zIndex, position: 'fixed', left: 0, top: 0 }} // 强制 fixed left-0 top-0，完全靠 transform 定位
    >
      {/* 添加一个透明的拖拽手柄或者整个区域可拖拽 */}
      {children}
    </motion.div>
  );
};


