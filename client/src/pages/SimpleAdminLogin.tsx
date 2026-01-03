import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { KeyIcon } from '@heroicons/react/24/outline';
import ThemeBackground from '@/components/ThemeBackground';
import { useAuthStore } from '@/store/authStore';

export default function SimpleAdminLogin() {
  const [secretKey, setSecretKey] = useState('');
  const navigate = useNavigate();
  // 我们临时用 useAuthStore 来模拟设置状态，或者这里你可以接你原本的管理员接口
  const { login } = useAuthStore(); 

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 这里就是你要的“直接输入密码”
    // 假设密码是 admin123 (你可以自己改)
    if (secretKey === 'admin123' || secretKey === 'admin') {
      toast.success('管理员认证通过');

      // 临时模拟：写入 Token 让系统认为已登录
      localStorage.setItem('token', 'admin-mock-token');
      // 这里可以手动触发一个状态更新，或者直接跳

      // 强制跳转到后台
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 500);
    } else {
      toast.error('管理员秘钥错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative isolate overflow-hidden bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0" />

      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 relative z-10">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
             <KeyIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">管理员系统</h2>
          <p className="text-gray-400 text-xs mt-1">请输入安全秘钥</p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-center tracking-widest"
            placeholder="ACCESS CODE"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all active:scale-95"
          >
            进入系统
          </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => navigate('/login')} className="text-gray-500 text-xs hover:text-gray-300">
                返回用户登录
            </button>
        </div>
      </div>
    </div>
  );
}

