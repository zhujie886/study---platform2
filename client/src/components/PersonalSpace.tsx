import React from 'react';
import Personalize from '../pages/Personalize';

interface PersonalSpaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalSpace({ isOpen, onClose }: PersonalSpaceProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full h-full">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-white"
        >
          Close
        </button>
        <div className="absolute inset-0">
          <Personalize />
        </div>
      </div>
    </div>
  );
}
