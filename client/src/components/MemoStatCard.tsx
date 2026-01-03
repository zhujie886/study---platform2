// @ts-nocheck
// @ts-nocheck
import React from 'react';
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MemoStatCardProps {
  category: string;
  count: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const MemoStatCard = React.memo(({ category, count, icon, isActive, onClick }: MemoStatCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden p-4 rounded-2xl cursor-pointer transition-all duration-300",
        "flex flex-col justify-between h-28 min-w-[140px]",
        // 核心改变：使用玻璃拟态 glass-panel，不再是纯色背景
        "glass-panel hover:-translate-y-1 hover:shadow-2xl",
        isActive ? "ring-2 ring-white ring-opacity-80 bg-white/40" : "bg-white/20 hover:bg-white/30"
      )}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 装饰性光晕 */}
      {isActive && <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/30 blur-2xl rounded-full" />}

      <div className="flex justify-between items-start">
        <div className={cn("p-2 rounded-xl backdrop-blur-md", isActive ? "bg-white/80 shadow-sm" : "bg-white/40")}>
          {icon}
        </div>
        {isActive && (
          <motion.div layoutId="active-dot" className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        )}
      </div>

      <div>
        <motion.p 
          className="text-3xl font-bold tracking-tight drop-shadow-sm"
          initial={0} animate={count}
          style={{ color: 'var(--text-main)' }}
        >
          {count}
        </motion.p>
        <p className="text-sm font-medium opacity-80" style={{ color: 'var(--text-main)' }}>
          {category}
        </p>
      </div>
    </motion.div>
  );
});

export default MemoStatCard;



