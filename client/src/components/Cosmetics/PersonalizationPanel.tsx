import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/i18n/LanguageContext';

const FRAMES = [
    { id: 'default', nameKey: '无边框', color: '#9ca3af' },
    { id: 'thorn', nameKey: '荆棘帝王', color: '#ef4444' },
    { id: 'ocean', nameKey: '海洋海王', color: '#0ea5e9' },
    { id: 'emperor', nameKey: '至尊皇帝', color: '#fbbf24' },
];

const PETS = [
    { id: 'dog', nameKey: '柴犬', icon: '🐶' },
    { id: 'cat', nameKey: '布偶', icon: '🐱' },
    { id: 'fox', nameKey: '阿狸', icon: '🦊' },
    { id: 'bunny', nameKey: '玉兔', icon: '🐰' },
];

export default function PersonalizationPanel({ currentFrame, onUpdateFrame, onClose }: any) {
    const { t } = useLanguage();
    const changePet = (petId: string) => {
        localStorage.setItem('user_pet_type', petId);
        window.dispatchEvent(new Event('personalization-updated'));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
            <div className="bg-white w-[360px] rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 relative">
                    <h2 className="text-white text-xl font-bold">{t('装扮中心')}</h2>
                    <p className="text-white/80 text-xs mt-1">{t('定制你的专属助手风格')}</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* 边框选择 */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('头像边框')}</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {FRAMES.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => onUpdateFrame(f.id)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${currentFrame === f.id ? 'scale-110 shadow-lg' : 'opacity-60 grayscale'}`}
                                    style={{ borderColor: f.color }}
                                >
                                    <div className="w-full h-full bg-gray-100 rounded-full" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 宠物选择 */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">{t('选择伴宠')}</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {PETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => changePet(p.id)}
                                    className="aspect-square rounded-xl bg-gray-50 hover:bg-indigo-50 flex flex-col items-center justify-center gap-1 border border-transparent hover:border-indigo-200 transition-all"
                                >
                                    <span className="text-2xl">{p.icon}</span>
                                    <span className="text-[10px] text-gray-500 font-bold">{t(p.nameKey)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

