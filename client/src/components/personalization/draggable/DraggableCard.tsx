import React, { useState } from 'react';

import { motion } from 'framer-motion';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/i18n/LanguageContext';



interface DraggableCardProps {

  title: string;

  lines: string[];

  defaultPos?: { x: number; y: number };

  onMove?: (pos: { x: number; y: number }) => void;

  onClose?: () => void;

  onRefresh?: () => void;

}



export const DraggableCard: React.FC<DraggableCardProps> = ({

  title,

  lines,

  defaultPos = { x: 320, y: 200 },

  onMove,

  onClose,

  onRefresh,

}) => {

  const { t } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);



  return (

    <motion.div

      drag

      dragMomentum={false}

      dragElastic={0.1}

      initial={defaultPos}

      onDragEnd={(_, info) => onMove?.({ x: info.point.x, y: info.point.y })}

      className="fixed z-50 bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl overflow-hidden w-72 flex flex-col select-none"

      style={{ top: 0, left: 0 }}

    >

      <div

        className="h-10 bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200 flex items-center justify-between px-3 cursor-move"

        onMouseDown={(e) => e.preventDefault()}

      >

        <div className="flex items-center gap-2">

          <Bars3Icon className="w-4 h-4 text-amber-600" />

          <span className="font-bold text-sm text-amber-800">{title}</span>

        </div>

        <div className="flex items-center gap-1">

          <button onClick={onRefresh} className="w-5 h-5 rounded-full bg-blue-200 hover:bg-blue-300 text-[10px]" title={t('刷新')}>

            ↻

          </button>

          <button

            onClick={() => setIsMinimized(!isMinimized)}

            className="w-5 h-5 rounded-full bg-yellow-300 hover:bg-yellow-400 text-[10px]"

            title={t('最小化')}

          >

            –

          </button>

          {onClose && (

            <button

              onClick={onClose}

              className="w-5 h-5 rounded-full bg-red-400 hover:bg-red-500 transition text-white text-[10px]"

              title={t('关闭')}

            >

              ×

            </button>

          )}

        </div>

      </div>



      {!isMinimized && (

        <div

          className="p-4 max-h-72 overflow-y-auto custom-scrollbar bg-white/70"

          style={{ resize: 'both', overflow: 'auto', minWidth: '220px', minHeight: '140px' }}

        >

          <ul className="space-y-2">

            {lines.map((line, i) => (

              <li

                key={i}

                className="text-sm text-gray-700 border-b border-gray-100 pb-1 last:border-0 flex items-start gap-2"

              >

                <span className="text-indigo-400 mt-0.5">-</span>

                <span className="break-all">{line}</span>

              </li>

            ))}

            {lines.length === 0 && <li className="text-xs text-gray-400 text-center">{t('暂无日程')}</li>}

          </ul>

        </div>

      )}

    </motion.div>

  );

};





