import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ThemeMode = 'macaron' | 'cyber' | 'forest';

const EMOJIS = ['✨', '💖', '🌸', '🌟', '🍀', '🌈', '💫'];

interface Props {
  enabled?: boolean;
  theme?: ThemeMode;
  onDoubleClick?: () => void;
}

export const ClickEffects = ({ enabled = true, onDoubleClick }: Props) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; char: string }[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button')) return;

      const id = Date.now();
      const char = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      setParticles((prev) => [...prev, { id, x: e.clientX, y: e.clientY, char }]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1000);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" onDoubleClick={onDoubleClick}>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, scale: 0.5, opacity: 1 }}
            animate={{
              y: p.y - 80,
              x: p.x + (Math.random() - 0.5) * 60,
              opacity: 0,
              scale: 1.5,
              rotate: (Math.random() - 0.5) * 45,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute text-2xl filter drop-shadow-md select-none"
          >
            {p.char}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};



