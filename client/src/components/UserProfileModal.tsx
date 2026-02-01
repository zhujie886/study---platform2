import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Edit2, User, Sparkles } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ThemeSwitcher from './ThemeSwitcher';
import { useLanguage } from '@/i18n/LanguageContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // 使用你的 AuthStore 类型
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [bio, setBio] = useState(user?.bio || t('这里是我的个性签名，写点什么吧~'));
  const [isEditingBio, setIsEditingBio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.bio) {
      setBio(t('这里是我的个性签名，写点什么吧~'));
    }
  }, [t, user?.bio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
      // 这里可以添加上传到服务器的逻辑
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="h-32 bg-gradient-to-r from-primary-300 to-primary-500 relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex justify-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-primary-50">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-300 bg-primary-50">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-transform hover:scale-110"
                >
                  <Camera size={18} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                {user?.username || t('未登录用户')}
                <Sparkles size={18} className="text-primary-500" />
              </h2>

              <div className="relative group inline-block max-w-xs">
                {isEditingBio ? (
                  <input
                    autoFocus
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={() => setIsEditingBio(false)}
                    className="w-full text-center border-b-2 border-primary-300 focus:outline-none text-gray-600 pb-1"
                  />
                ) : (
                  <p
                    onClick={() => setIsEditingBio(true)}
                    className="text-gray-500 cursor-pointer hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {bio}
                    <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
                <h3 className="text-sm font-semibold text-primary-700 mb-3 uppercase tracking-wider">
                  {t('选择你的主题风格')}
                </h3>
                <div className="flex justify-center">
                  <ThemeSwitcher />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button onClick={onClose} className="px-8 py-2.5 bg-primary-500 text-white rounded-full font-medium shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all">
                {t('保存修改')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
