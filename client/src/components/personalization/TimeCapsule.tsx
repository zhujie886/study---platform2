import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon, GiftIcon, ClockIcon } from '@heroicons/react/24/solid';

export const TimeCapsule = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<'create' | 'locked' | 'open'>('create');
  const [content, setContent] = useState('');
  const [unlockTime, setUnlockTime] = useState('');

  const seal = () => {
    if(!content) return;
    setStep('locked');
    setUnlockTime(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()); // 模拟3天后
  };

  return (
    <div className="w-80 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-[30px] shadow-2xl p-6 relative border border-white flex flex-col min-h-[400px]">
      <button onClick={onClose} className="absolute top-4 right-4 text-purple-300 hover:text-purple-500 transition-colors">×</button>
      
      <div className="flex items-center gap-2 mb-6 text-purple-800 font-bold">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <GiftIcon className="w-5 h-5 text-purple-500" />
        </div>
        时光胶囊
      </div>

      {step === 'create' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
            <div className="relative flex-1 mb-4">
                <textarea 
                    className="w-full h-full min-h-[180px] rounded-2xl bg-white/60 p-4 text-sm outline-none resize-none focus:ring-2 focus:ring-purple-200 text-slate-600 leading-relaxed"
                    placeholder="写给未来的自己：\n最近过得好吗？有没有坚持梦想？..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-xs text-purple-300">
                    {content.length} 字
                </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-purple-500 mb-4 bg-purple-100/50 p-2 rounded-lg">
                <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> 开启时间:</span>
                <span className="font-bold">3天后</span>
            </div>
            
            <button onClick={seal} className="w-full bg-gradient-to-r from-purple-400 to-fuchsia-400 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95">
                封存胶囊 📦
            </button>
        </motion.div>
      )}

      {step === 'locked' && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div 
                className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-[inset_0_5px_20px_rgba(0,0,0,0.05)] ring-8 ring-purple-100"
            >
                <LockClosedIcon className="w-12 h-12 text-purple-300" />
            </motion.div>
            <h3 className="text-lg text-purple-800 font-bold mb-2">胶囊已埋藏</h3>
            <p className="text-xs text-purple-400 leading-5 px-4">
                静待时间流逝，<br/>在 {unlockTime} 开启这份惊喜。
            </p>
            <button 
                onClick={() => setStep('open')} 
                className="mt-8 text-[10px] text-slate-300 hover:text-purple-400 underline"
            >
                (演示模式: 强制开启)
            </button>
        </motion.div>
      )}

      {step === 'open' && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-white/80 p-5 rounded-2xl text-purple-800 text-sm relative border border-purple-100 shadow-sm"
        >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-300 text-xs px-3 py-1 rounded-full text-yellow-900 font-bold shadow-sm">
                ✨ 胶囊开启
            </div>
            <div className="mt-4 leading-relaxed whitespace-pre-wrap font-medium">
                "{content}"
            </div>
            <div className="mt-6 text-right text-xs text-purple-400">
                —— 来自 2025年的你
            </div>
        </motion.div>
      )}
    </div>
  );
};


