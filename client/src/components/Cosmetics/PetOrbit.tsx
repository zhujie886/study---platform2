import React, { useState, useEffect } from 'react';
import './cosmetics.css';

const EMOJIS: any = { dog: '🐶', cat: '🐱', fox: '🦊', bunny: '🐰' };

export const PetOrbit = () => {
  const [type, setType] = useState('dog');
  const [isSleeping, setIsSleeping] = useState(false);

  useEffect(() => {
    const load = () => setType(localStorage.getItem('user_pet_type') || 'dog');
    load();
    window.addEventListener('personalization-updated', load);
    return () => window.removeEventListener('personalization-updated', load);
  }, []);

  return (
    <>
      {/* 轨道动画层 */}
      <div className={`absolute inset-0 rounded-full border border-dashed border-gray-300/50 ${isSleeping ? '' : 'animate-[spin_10s_linear_infinite]'}`}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full opacity-50" />
      </div>

      {/* 宠物交互盒子 (点击这里才有效) */}
      <div 
        className={`pet-interaction-box ${isSleeping ? 'translate-y-[-36px] rotate-12' : 'animate-[orbit-run_8s_linear_infinite]'}`}
        style={{ 
            animation: isSleeping ? 'none' : 'spin-slow 8s linear infinite reverse',
            // 注意：这里我们用了一个反向旋转来保持宠物头朝上，简化逻辑
            transformOrigin: '50% 120px' // 围绕中心点旋转
        }}
        onClick={(e) => {
            e.stopPropagation();
            setIsSleeping(!isSleeping);
        }}
        title={isSleeping ? "Zzz... (点击唤醒)" : "点击休息"}
      >
         <div className="text-3xl filter drop-shadow-md select-none hover:scale-125 transition-transform cursor-pointer">
            {isSleeping ? '💤' : EMOJIS[type]}
         </div>
      </div>
    </>
  );
};

