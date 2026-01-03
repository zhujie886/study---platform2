import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  id: string; children: React.ReactNode; defaultX: number; defaultY: number; className?: string;
}

export const DraggableItem: React.FC<Props> = ({ id, children, defaultX, defaultY, className="" }) => {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [zIndex, setZIndex] = useState(100);

  useEffect(() => {
    const saved = localStorage.getItem(`drag_pos_${id}`);
    if (saved) { try { setPos(JSON.parse(saved)); } catch(e){} }
  }, [id]);

  const handleDragEnd = (_:any, info:any) => {
      const newPos = { x: pos.x + info.offset.x, y: pos.y + info.offset.y };
      localStorage.setItem(`drag_pos_${id}`, JSON.stringify(newPos));
  };

  return (
    <motion.div
      drag dragMomentum={false}
      initial={{ x: pos.x, y: pos.y }}
      onDragEnd={handleDragEnd}
      onPointerDown={() => setZIndex(z => z + 1)}
      className={`fixed ${className}`}
      style={{ zIndex, left: 0, top: 0, touchAction: 'none' }}
    >
      {children}
    </motion.div>
  );
};

