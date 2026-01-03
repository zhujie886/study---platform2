
import React, { useState, useEffect } from 'react';

const PetCompanion = () => {
  // 定义宠物列表 
  const [pets] = useState([
    { id: 1, name: "咪咪", emoji: "🐱", desc: "一直在陪着你" },
    { id: 2, name: "旺财", emoji: "🐶", desc: "忠诚的守护者" },
    { id: 3, name: "灵狐", emoji: "🦊", desc: "带来好运" },
    { id: 4, name: "玉兔", emoji: "🐰", desc: "温柔可爱" }
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const switchPet = (direction) => {
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentIndex((prev) => (prev + 1) % pets.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + pets.length) % pets.length);
      }
      setIsAnimating(false);
    }, 300); // 等待淡出动画
  };

  const currentPet = pets[currentIndex];

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '20px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative',
      width: '100%'
    }}>
      <h3 style={{ width: '100%', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: '#2d3748', fontWeight: 'bold' }}>
        🐾 我的伙伴
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* 左切换按钮 */}
        <button 
          onClick={() => switchPet('prev')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '10px', opacity: 0.6, transition: '0.2s' }}
        >◀️</button>

        {/* 宠物展示区 - 增加呼吸动画 */}
        <div style={{ 
          width: '120px', height: '140px', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'breathe 3s ease-in-out infinite',
          opacity: isAnimating ? 0 : 1,
          transition: 'all 0.3s ease',
          transform: isAnimating ? 'scale(0.8)' : 'scale(1)'
        }}>
          {/* 这里显示 Emoji 或图片 */}
          <div style={{ fontSize: '70px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))', marginBottom: '10px' }}>
            {currentPet.emoji}
          </div>
          
          <div style={{ fontWeight: 'bold', color: '#4a5568', fontSize: '16px' }}>
            {currentPet.name}
          </div>
          <div style={{ fontSize: '12px', color: '#a0aec0' }}>
            {currentPet.desc}
          </div>
        </div>

        {/* 右切换按钮 */}
        <button 
          onClick={() => switchPet('next')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '10px', opacity: 0.6, transition: '0.2s' }}
        >▶️</button>
      </div>

      <style>{`
        @keyframes breathe { 0% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-6px) scale(1.05); } 100% { transform: translateY(0px) scale(1); } }
      `}</style>
    </div>
  );
};

export default PetCompanion;


