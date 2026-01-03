// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultantAPI } from '@/services/api'; // 假设 API 在这里
import toast from 'react-hot-toast';

export default function ServiceCreationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 100,
    duration: 60, // in minutes
    category: 'career',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 假设有一个创建服务的API
      // await consultantAPI.createService(formData);
      toast.success('服务创建成功！');
      navigate('/profile/me'); // 跳转回个人主页
    } catch (error) {
      toast.error('服务创建失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'duration' ? Number(value) : value }));
  };

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">创建您的咨询服务</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">服务标题</label>
          <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">服务描述</label>
          <textarea name="description" id="description" required value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">价格 (元)</label>
            <input type="number" name="price" id="price" required value={formData.price} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">时长 (分钟)</label>
            <input type="number" name="duration" id="duration" required value={formData.duration} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类</label>
          <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm">
            <option value="career">职业规划</option>
            <option value="emotion">情感咨询</option>
            <option value="education">学业指导</option>
          </select>
        </div>
        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-primary-600 text-white font-bold rounded-lg text-lg hover:bg-primary-700 transition disabled:bg-gray-400">
            {loading ? '正在提交...' : '发布服务'}
          </button>
        </div>
      </form>
    </div>
  );
}
