import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import ThemeBackground from '../components/ThemeBackground';
import {
  EnvelopeIcon,
  LockClosedIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    setIsLoading(true);
    try {
      await register(formData.username, formData.password, formData.email);
      toast.success('注册成功！请登录');
      navigate('/login');
    } catch (error) {
      toast.error('注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ThemeBackground />
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="glass-card rounded-3xl p-10 shadow-2xl backdrop-blur-xl bg-white/40 border border-white/50">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-full bg-pink-100/50 text-pink-500 mb-4 animate-bounce">
               <SparklesIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 mb-1">创建你的账户</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1 uppercase">用户名</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-4 w-4 text-gray-400" /></div>
                <input type="text" required className="block w-full pl-9 pr-3 py-2.5 border-transparent bg-white/60 rounded-lg focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all text-sm" placeholder="怎么称呼你？" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1 uppercase">邮箱</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><EnvelopeIcon className="h-4 w-4 text-gray-400" /></div>
                <input type="email" required className="block w-full pl-9 pr-3 py-2.5 border-transparent bg-white/60 rounded-lg focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all text-sm" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1 uppercase">密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-4 w-4 text-gray-400" /></div>
                <input type="password" required className="block w-full pl-9 pr-3 py-2.5 border-transparent bg-white/60 rounded-lg focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all text-sm" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1 uppercase">确认密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-4 w-4 text-gray-400" /></div>
                <input type="password" required className="block w-full pl-9 pr-3 py-2.5 border-transparent bg-white/60 rounded-lg focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all text-sm" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-6 py-3 px-4 border border-transparent rounded-xl text-white font-bold bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-all transform hover:scale-[1.02] shadow-lg">
              {isLoading ? '注册中...' : '注册账户'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              已有账号？ <Link to="/login" className="font-bold text-pink-600 hover:text-pink-500 hover:underline transition-all">直接登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

