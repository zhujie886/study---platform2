import React, { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  className?: string;
}

export const DraggableWidget: React.FC<Props> = ({ 
  children, 
  initialX = 100, 
  initialY = 100, 
  zIndex = 50,
  className = "" 
}) => {
  const constraintsRef = useRef(null);

  return (
    <motion.div
      drag
      dragMomentum={false} // 关闭惯性，防止飞出屏幕
      initial={{ x: initialX, y: initialY, scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 100 }}
      className={`absolute cursor-grab ${className}`}
      style={{ zIndex }}
    >
      {children}
    </motion.div>
  );
};


