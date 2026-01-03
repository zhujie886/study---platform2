import React from 'react';

interface Props {
  theme?: string;
}

// 占位版 CreativeCanvas：避免 404，保留接口，未来可扩展图片墙/贴纸等能力
export const CreativeCanvas: React.FC<Props> = () => {
  return null;
};

export default CreativeCanvas;


