import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { XMarkIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Props {
  defaultPos: { x: number; y: number };
  onMove: (pos: { x: number; y: number }) => void;
  onClose: () => void;
  text?: string;
  onRefresh?: () => void;
}

export const DraggableNote: React.FC<Props> = ({ defaultPos, onMove, onClose, text = '' }) => {
  const [content, setContent] = useState(text || '写点什么吧...');
  const [isEditing, setIsEditing] = useState(false);
  const dragControls = useDragControls();

  // 自动保存防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('user_note_content', content);
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    const saved = localStorage.getItem('user_note_content');
    if (saved) setContent(saved);
  }, []);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragListener={false} // 只有按住头部才能拖动
      onDragEnd={(_, info) => {
        onMove({ x: info.point.x, y: info.point.y });
      }}
      initial={{ x: defaultPos.x, y: defaultPos.y, scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed z-[9999] w-64 min-h-[200px] flex flex-col"
      style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' }}
    >
      {/* 拟物化便签头部 (胶带效果) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="h-12 w-full relative cursor-move group z-10"
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-200/80 backdrop-blur-sm -rotate-2 transform shadow-sm border border-white/20" />
        <button 
          onClick={onClose}
          className="absolute right-0 top-0 p-1 bg-red-100 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 便签主体 */}
      <div className="flex-1 bg-[#fff7d1] rounded-b-xl p-4 text-slate-700 relative font-handwriting transform rotate-1 border border-yellow-200/50">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '100% 24px', marginTop: '24px' }} 
        />
        
        {isEditing ? (
          <textarea
            autoFocus
            className="w-full h-full bg-transparent resize-none outline-none text-lg leading-6"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={() => setIsEditing(false)}
            rows={6}
          />
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="w-full h-full min-h-[140px] whitespace-pre-wrap cursor-text text-lg leading-6"
          >
            {content}
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <CheckIcon className="w-5 h-5 text-green-600" /> : <PencilSquareIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


