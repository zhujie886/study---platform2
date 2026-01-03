import { useEffect, useState } from 'react';

export function EasterEggOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/30 via-white/10 to-sky-200/30 animate-pulse" />
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-xl animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.2}s`,
            }}
          >
            {['✨', '🌸', '💫', '💖'][i % 4]}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10%); opacity: 1; }
          100% { transform: translateY(60%); opacity: 0; }
        }
        .animate-fall { animation: fall 2s ease-out forwards; }
      `}</style>
    </div>
  );
}



