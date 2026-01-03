import React from 'react';
import './cosmetics.css';

export type BadgeType = 'admin' | 'verified' | 'artist' | 'vip' | 'newbie' | 'bug_hunter';

interface BadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const badgeConfig = {
  admin: { color: 'from-red-500 to-red-700', icon: '🛡️', label: '管理员', ring: 'ring-red-200' },
  verified: { color: 'from-blue-400 to-blue-600', icon: '✅', label: '认证用户', ring: 'ring-blue-200' },
  artist: { color: 'from-purple-400 to-pink-500', icon: '🎨', label: '创作者', ring: 'ring-purple-200' },
  vip: { color: 'from-yellow-300 to-yellow-600', icon: '👑', label: 'VIP', ring: 'ring-yellow-200' },
  newbie: { color: 'from-green-400 to-emerald-600', icon: '🌱', label: '萌新', ring: 'ring-green-200' },
  bug_hunter: { color: 'from-gray-700 to-black', icon: '🐞', label: '赏金猎人', ring: 'ring-gray-400' },
};

const Badge: React.FC<BadgeProps> = ({ type, size = 'sm', showLabel = false }) => {
  const config = badgeConfig[type];
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div className={`flex items-center gap-2 group`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-lg bg-gradient-to-br ${config.color}
          flex items-center justify-center text-white font-bold shadow-lg
          transform transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:rotate-3
          badge-shine ring-2 ring-offset-1 ring-offset-white ${config.ring}
        `}
        title={config.label}
      >
        <span className="drop-shadow-md filter">{config.icon}</span>
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-gray-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
          {config.label}
        </span>
      )}
    </div>
  );
};

export default Badge;

