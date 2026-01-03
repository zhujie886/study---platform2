import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid'; 
import PersonalSpace from './PersonalSpace';
import { useTheme } from '../hooks/useTheme';

export default function FloatingGlobalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { styleMode } = useTheme();

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[9000]">
        <button
          onClick={() => setIsOpen(true)}
          className={`relative group w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95
            ${styleMode === 'fancy' ? 'bg-gradient-to-r from-[var(--theme-hex)] to-purple-600 text-white' : 'bg-white text-slate-800 border border-gray-200'}
          `}
        >
          {styleMode === 'fancy' && <div className="absolute -inset-1 bg-[var(--theme-hex)] rounded-full blur opacity-40 animate-pulse"></div>}
          <SparklesIcon className={`w-7 h-7 relative z-10 ${styleMode === 'fancy' ? 'animate-spin-slow' : ''}`} />
        </button>
      </div>
      <PersonalSpace isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}


