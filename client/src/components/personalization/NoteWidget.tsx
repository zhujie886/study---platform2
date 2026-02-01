import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export const NoteWidget = () => {
  const { t } = useLanguage();
  const [text, setText] = useState(() => t('note.default_text'));

  useEffect(() => {
    const saved = localStorage.getItem('my_sticky_note');
    if (saved) setText(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    localStorage.setItem('my_sticky_note', e.target.value);
  };

  return (
    <div className="w-64 h-64 bg-yellow-100 shadow-[5px_5px_15px_rgba(0,0,0,0.15)] rounded-br-3xl relative overflow-hidden flex flex-col group">
      {/* 顶部胶带 */}
      <div className="h-8 bg-yellow-200/50 w-full flex items-center justify-center cursor-move">
        <div className="w-20 h-4 bg-yellow-300/60 opacity-50 rotate-1"></div>
      </div>
      
      <textarea 
        className="flex-1 w-full bg-transparent p-4 resize-none outline-none font-handwriting text-gray-700 text-lg leading-relaxed"
        value={text}
        onChange={handleChange}
        placeholder={t('note.placeholder')}
      />
      <div className="absolute bottom-2 right-4 text-xs text-yellow-600/50 select-none">
        {t('note.autosave')}
      </div>
    </div>
  );
};


