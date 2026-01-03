import React, { useEffect, useMemo, useState } from "react";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { User, Search, Plus } from "lucide-react";
import PersonalCenter from "../components/PersonalCenter";
import { useTheme } from "../hooks/useTheme";
import { useAuthStore } from "../store/authStore";
import { useMemoStore } from "../store/memoStore";
import { motion } from "framer-motion";

export default function MemoDashboard() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { memos, fetchMemos, isLoading } = useMemoStore();
  const [activeCategory, setActiveCategory] = useState("总备忘录");
  const [isPersonalCenterOpen, setIsPersonalCenterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const upcomingWindowMs = 7 * 24 * 60 * 60 * 1000;
  const isUpcoming = (memo: any) => {
    if (!memo?.reminderTime) return false;
    const time = new Date(memo.reminderTime).getTime();
    if (Number.isNaN(time)) return false;
    const now = Date.now();
    return time >= now && time <= now + upcomingWindowMs;
  };

  const statData = useMemo(() => {
    const total = memos.length;
    const completed = memos.filter((m) => m.status === 'completed').length;
    const pending = memos.filter((m) => m.status !== 'completed').length;
    const upcoming = memos.filter(isUpcoming).length;

    return [
      { category: "总备忘录", count: total, icon: <DocumentIcon className="w-6 h-6" /> },
      { category: "待处理", count: pending, icon: <ClockIcon className="w-6 h-6" /> },
      { category: "已完成", count: completed, icon: <ChartBarIcon className="w-6 h-6" /> },
      { category: "即将到来", count: upcoming, icon: <CalendarDaysIcon className="w-6 h-6" /> },
    ];
  }, [memos]);

  const filteredMemos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return memos.filter((memo: any) => {
      if (activeCategory === '待处理' && memo.status === 'completed') return false;
      if (activeCategory === '已完成' && memo.status !== 'completed') return false;
      if (activeCategory === '即将到来' && !isUpcoming(memo)) return false;

      if (!normalizedQuery) return true;
      const title = String(memo.title || '').toLowerCase();
      const content = String(memo.content || '').replace(/<[^>]+>/g, '').toLowerCase();
      return title.includes(normalizedQuery) || content.includes(normalizedQuery);
    });
  }, [memos, activeCategory, searchQuery]);

  const formatMemoDate = (memo: any) => {
    const dateValue = memo?.reminderTime || memo?.updatedAt || memo?.createdAt;
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen w-full pb-20 transition-colors duration-500">
      <nav className="glass-card sticky top-4 mx-4 rounded-2xl px-6 py-4 flex justify-between items-center z-40 mb-8">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
             M
           </div>
           <h1 className="text-xl font-bold tracking-wide" style={{ color: 'var(--text-main)' }}>
             我的备忘录
           </h1>
         </div>

         <button 
           onClick={() => setIsPersonalCenterOpen(true)}
           className="relative w-11 h-11 rounded-full border-2 border-white/50 shadow-md overflow-hidden hover:scale-105 transition-transform"
         >
           {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><User size={20} className="text-gray-500"/></div>}
         </button>
      </nav>

      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10 px-2">
           <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-main)' }}>
             你好，{user?.username || 'Traveler'}!
           </h2>
           <p className="text-lg opacity-80" style={{ color: 'var(--text-muted)' }}>
             当前主题: {theme === 'cyber' ? '赛博朋克' : theme === 'ocean' ? '深海之梦' : theme === 'forest' ? '迷雾森林' : '樱花物语'}
           </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statData.map((item) => (
            <motion.div
              key={item.category}
              onClick={() => setActiveCategory(item.category)}
              whileHover={{ y: -5 }}
              className={`glass-card p-4 rounded-2xl cursor-pointer transition-all ${activeCategory === item.category ? 'ring-2 ring-pink-400 bg-white/40' : 'bg-white/20'}`}
            >
              <div className="mb-3 p-2 rounded-lg bg-white/30 w-fit" style={{ color: 'var(--primary-color)' }}>
                {item.icon}
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>{item.count}</p>
              <p className="text-sm font-medium opacity-70" style={{ color: 'var(--text-muted)' }}>{item.category}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-2 flex items-center gap-2 mb-6">
           <Search className="ml-3 opacity-50" size={20} style={{ color: 'var(--text-main)' }} />
           <input 
             placeholder="搜索..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="bg-transparent border-none outline-none flex-1 py-2 font-medium placeholder-gray-500/50"
             style={{ color: 'var(--text-main)' }}
           />
           <button 
             className="px-6 py-2 rounded-xl font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
             style={{ backgroundColor: 'var(--primary-color)' }}
           >
             <Plus size={18} strokeWidth={3} /> 新建
           </button>
        </div>

        <div className="space-y-4">
           {isLoading ? (
             <div className="glass-card p-6 rounded-2xl text-center text-sm" style={{ color: 'var(--text-muted)' }}>
               正在加载备忘录...
             </div>
           ) : filteredMemos.length === 0 ? (
             <div className="glass-card p-6 rounded-2xl text-center text-sm" style={{ color: 'var(--text-muted)' }}>
               暂无备忘录
             </div>
           ) : (
           filteredMemos.map(memo => (
             <div key={memo.id} className="glass-card p-5 rounded-2xl flex justify-between items-center group hover:bg-white/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${memo.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'} shadow-[0_0_8px_currentColor]`} />
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>{memo.title || '未命名备忘录'}</h3>
                    <p className="text-xs opacity-60 font-medium" style={{ color: 'var(--text-muted)' }}>{formatMemoDate(memo)}</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 rounded-lg bg-white/20 text-xs font-bold hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-main)' }}>
                  编辑
                </button>
             </div>
           ))) }
        </div>
      </div>

      <PersonalCenter 
        isOpen={isPersonalCenterOpen} 
        onClose={() => setIsPersonalCenterOpen(false)} 
      />
    </div>
  );
}
