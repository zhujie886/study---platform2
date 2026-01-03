import React from 'react';
import { ClickEffects } from './ClickEffects';

// 轻量封装：默认开启点击特效，避免缺失导致 404
export const ClickEffectLayer: React.FC = () => {
  return <ClickEffects enabled />;
};

export default ClickEffectLayer;


