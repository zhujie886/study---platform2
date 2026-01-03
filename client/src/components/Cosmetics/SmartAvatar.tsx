import React, { useState } from 'react';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/solid';

interface Props {
  src?: string;
  size?: number;
  className?: string;
  allowEdit?: boolean;
  onEdit?: () => void;
  alt?: string;
}

const SmartAvatar: React.FC<Props> = ({ src, size = 40, className = "", allowEdit = false, onEdit, alt = "Avatar" }) => {
  const [error, setError] = useState(false);
  const currentFrame = localStorage.getItem('user_custom_frame') || 'none';

  // 边框样式定义
  const getFrameStyle = () => {
    switch(currentFrame) {
      case 'gold': return 'ring-4 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]';
      case 'pink': return 'ring-4 ring-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.6)]';
      case 'blue': return 'ring-4 ring-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)]';
      case 'green': return 'ring-4 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]';
      case 'neon': return 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-pulse';
      default: return 'ring-2 ring-white/20';
    }
  };

  return (
    <div 
        className={`relative rounded-full flex-shrink-0 transition-all duration-300 ${getFrameStyle()} ${className}`} 
        style={{ width: size, height: size }}
    >
      {src && !error ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover rounded-full bg-gray-100"
          onError={() => setError(true)} 
        />
      ) : (
        <UserCircleIcon className="w-full h-full text-gray-300 bg-gray-50 rounded-full" />
      )}

      {/* 边框光泽特效 */}
      {currentFrame !== 'none' && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 to-transparent opacity-50 pointer-events-none" />
      )}

      {/* 编辑按钮 */}
      {allowEdit && (
        <div 
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit?.(); } }}
          className="absolute bottom-0 right-0 p-1.5 bg-gray-800/80 text-white rounded-full hover:bg-black transition shadow-sm backdrop-blur-sm cursor-pointer"
          title="更换头像"
        >
          <CameraIcon className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default SmartAvatar;


