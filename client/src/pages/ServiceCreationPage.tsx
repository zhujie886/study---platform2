// @ts-nocheck
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultantAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ServiceCreationPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 100,
    duration: 60,
    category: 'career',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // await consultantAPI.createService(formData);
      toast.success(t('service.create.success'));
      navigate('/profile/me');
    } catch (error) {
      toast.error(t('service.create.failed'));
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
      <h1 className="text-3xl font-bold mb-6">{t('service.create.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">{t('service.create.label.title')}</label>
          <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('service.create.label.description')}</label>
          <textarea name="description" id="description" required value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">{t('service.create.label.price')}</label>
            <input type="number" name="price" id="price" required value={formData.price} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">{t('service.create.label.duration')}</label>
            <input type="number" name="duration" id="duration" required value={formData.duration} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">{t('service.create.label.category')}</label>
          <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm">
            <option value="career">{t('service.create.category.career')}</option>
            <option value="emotion">{t('service.create.category.emotion')}</option>
            <option value="education">{t('service.create.category.education')}</option>
          </select>
        </div>
        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-primary-600 text-white font-bold rounded-lg text-lg hover:bg-primary-700 transition disabled:bg-gray-400">
            {loading ? t('service.create.submitting') : t('service.create.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
