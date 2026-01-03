import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';
import { themes, Theme } from '@/themes';

const Tooltip = ({ theme, visible }: { theme: Theme; visible: boolean }) => {
  const isGorgeous = theme.type === 'gorgeous';
  const style = {
    background: isGorgeous ? theme.styles['--background-main'] : theme.styles['--primary-color'],
    color: isGorgeous ? theme.styles['--text-main'] : '#FFFFFF',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 'bold',
    textShadow: isGorgeous ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
      transition={{ duration: 0.2 }}
      className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
      style={style}
    >
      {theme.name}
    </motion.div>
  );
};

export default function ThemeSwitcher() {
  const { theme: activeTheme, setTheme } = useThemeStore();
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {themes.map((t) => (
        <div
          key={t.name}
          className="relative"
          onMouseEnter={() => setHoveredTheme(t.name)}
          onMouseLeave={() => setHoveredTheme(null)}
        >
          <Tooltip theme={t} visible={hoveredTheme === t.name} />
          <button
            onClick={() => setTheme(t.name)}
            className="relative group focus:outline-none"
          >
            {activeTheme.name === t.name && (
              <motion.div
                layoutId="active-theme-ring"
                className="absolute -inset-1.5 rounded-full border-2"
                style={{ borderColor: t.styles['--accent-color'] }}
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md border-2 border-white/50 cursor-pointer overflow-hidden"
              style={{ background: t.styles['--background-main'] }}
              whileHover={{ scale: 1.15, y: -5 }}
              whileTap={{ scale: 0.9 }}
            />
          </button>
        </div>
      ))}
    </div>
  );
}


