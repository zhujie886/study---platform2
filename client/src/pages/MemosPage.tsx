import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import { DocumentTextIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function MemosPage() {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchMemos = async () => {
    try {
      const res = await api.get('/memos');
      // 兼容后端返回格式: { memos: [...] } 或 [...]
      const list = Array.isArray(res.data) ? res.data : (res.data.memos || []);
      setMemos(list);
    } catch (error) {
      console.error(error);
      toast.error('加载备忘录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      await api.post('/memos', {
        title: newTitle,
        content: '',
        priority: 0
      });
      setNewTitle('');
      toast.success('备忘录已创建');
      fetchMemos();
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除吗？')) return;
    try {
      await api.delete(`/memos/${id}`);
      setMemos(memos.filter((m: any) => m.id !== id));
      toast.success('已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DocumentTextIcon className="w-8 h-8 text-blue-500"/> 我的备忘录
        </h1>
      </div>

      {/* 快速创建栏 */}
      <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <input 
          type="text" 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="写下新的想法..."
          className="flex-1 border-none bg-transparent focus:ring-0 text-lg placeholder-gray-400"
        />
        <button 
          type="submit" 
          disabled={isCreating || !newTitle.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5"/> 新建
        </button>
      </form>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">加载中...</div>
      ) : memos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">还没有备忘录，试着创建一条吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memos.map((memo: any) => (
            <div key={memo.id} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition relative">
              <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{memo.title || '无标题'}</h3>
              <p className="text-gray-500 text-sm line-clamp-3 h-12">
                {memo.content || '暂无内容...'}
              </p>
              <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                <span>{new Date(memo.createdAt || Date.now()).toLocaleDateString()}</span>
                <button 
                  onClick={() => handleDelete(memo.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <TrashIcon className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
