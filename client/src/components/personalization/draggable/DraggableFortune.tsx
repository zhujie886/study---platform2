import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { fortunePool } from '@/utils/fortunePool';

interface Props {
  text: string;
  defaultPos?: { x: number; y: number };
  onMove?: (pos: { x: number; y: number }) => void;
  onClose?: () => void;
  onRefresh?: (next: string) => void;
}

export const DraggableFortune: React.FC<Props> = ({
  text,
  defaultPos = { x: 520, y: 160 },
  onMove,
  onClose,
  onRefresh,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [fortune, setFortune] = useState(text || '');
  const pool = useMemo(() => fortunePool, []);

  const drawFortune = () => {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const next = `${pick.tier} ｜ ${pick.text}`;
    setFortune(next);
    onRefresh?.(next);
  };

  useEffect(() => {
    if (!fortune) drawFortune();
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={defaultPos}
      onDragEnd={(_, info) => onMove?.({ x: info.point.x, y: info.point.y })}
      className="fixed z-50 bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-100 shadow-2xl rounded-2xl overflow-hidden w-72 flex flex-col select-none"
      style={{ top: 0, left: 0 }}
    >
      <div
        className="h-10 bg-gradient-to-r from-purple-200 via-pink-100 to-blue-100 border-b border-white/60 flex items-center justify-between px-3 cursor-move"
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
          <SparklesIcon className="w-4 h-4" />
          <span>今日运势 · 求签</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={drawFortune}
            className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-xs text-purple-700 shadow"
            title="求一签"
          >
            签
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-5 h-5 rounded-full bg-yellow-300 hover:bg-yellow-400 text-[10px]"
            title="最小化"
          >
            –
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-red-400 hover:bg-red-500 text-white text-[10px]"
              title="关闭"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div
          className="p-4 max-h-64 overflow-y-auto custom-scrollbar text-sm text-purple-900 whitespace-pre-wrap"
          style={{ resize: 'both', overflow: 'auto', minWidth: '220px', minHeight: '140px' }}
        >
          {fortune}
        </div>
      )}
    </motion.div>
  );
};


