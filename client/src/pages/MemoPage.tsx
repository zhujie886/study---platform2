import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  DocumentTextIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useMemoStore } from '@/store/memoStore';
import { socketService } from '@/services/socket';
import RichTextEditor from '@/components/RichTextEditor';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

export default function MemoPage() {
  const { memos, fetchMemos, createMemo, updateMemo, deleteMemo, searchMemos } = useMemoStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemo, setSelectedMemo] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    labels: [] as string[],
    priority: 0,
    color: '#3b82f6',
    reminderTime: '',
    isEncrypted: false,
    encryptionPassword: '',
  });

  useEffect(() => {
    fetchMemos();
    socketService.onMemoCreated(() => toast.success('新备忘录已创建'));
    socketService.onMemoUpdated(() => toast('备忘录已更新', { icon: '✅' }));
    socketService.onMemoDeleted(() => toast('备忘录已删除', { icon: '🗑️' }));
    return () => { socketService.removeAllListeners(); };
  }, [fetchMemos]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    query ? searchMemos(query) : fetchMemos();
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error('请填写标题和内容');
      return;
    }

    try {
      // 🔥 修复：构造干净的数据发送给后端
      const memoData = {
        ...formData,
        // 1. 数组直接发，不要 stringify
        labels: formData.labels,
        // 2. 确保优先级是数字
        priority: Number(formData.priority),
        // 3. 日期处理：如果有值则发，无值发 null
        reminderTime: formData.reminderTime ? new Date(formData.reminderTime).toISOString() : null
      };

      await createMemo(memoData);
      toast.success('备忘录创建成功！');
      setIsCreateModalOpen(false);
      resetForm();
      // fetchMemos(); // Store 通常会自动更新，或者通过 socket 更新
    } catch (error: any) {
      console.error('创建失败详情:', error);
      const msg = error.response?.data?.details || error.response?.data?.error || '创建失败';
      toast.error(msg);
    }
  };

  const handleEdit = async () => {
    if (!selectedMemo) return;
    try {
      const memoData = {
        ...formData,
        labels: formData.labels,
        priority: Number(formData.priority),
        reminderTime: formData.reminderTime ? new Date(formData.reminderTime).toISOString() : null
      };
      await updateMemo(selectedMemo.id, memoData);
      toast.success('备忘录更新成功！');
      setIsEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个备忘录吗？')) return;
    try {
      await deleteMemo(id);
      toast.success('删除成功');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const openEditModal = (memo: any) => {
    setSelectedMemo(memo);
    setFormData({
      title: memo.title || '',
      content: memo.content || '',
      labels: Array.isArray(memo.labels) ? memo.labels : [],
      priority: memo.priority || 0,
      color: memo.color || '#3b82f6',
      reminderTime: memo.reminderTime ? format(new Date(memo.reminderTime), "yyyy-MM-dd'T'HH:mm") : '',
      isEncrypted: memo.isEncrypted || false,
      encryptionPassword: '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      labels: [],
      priority: 0,
      color: '#3b82f6',
      reminderTime: '',
      isEncrypted: false,
      encryptionPassword: '',
    });
    setSelectedMemo(null);
  };

  const addLabel = (label: string) => {
    if (label && !formData.labels.includes(label)) {
      setFormData({ ...formData, labels: [...formData.labels, label] });
    }
  };

  const removeLabel = (label: string) => {
    setFormData({ ...formData, labels: formData.labels.filter((l) => l !== label) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">备忘录</h1>
          <p className="text-gray-600 mt-1">管理您的笔记和待办事项</p>
        </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 rounded-lg btn-soft"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            新建备忘录
          </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索备忘录..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!memos || memos.length === 0) ? (
          <div className="col-span-full text-center py-12">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-4">还没有备忘录</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg btn-soft"
              >
                创建第一个备忘录
              </button>
          </div>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              style={{ borderLeft: `4px solid ${memo.color || '#3b82f6'}` }}
            >
              <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex-1 truncate pr-2">
                {memo.title}
                {memo.isEncrypted && <LockClosedIcon className="inline w-4 h-4 ml-2 text-gray-500" />}
              </h3>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEditModal(memo)} className="text-gray-400 hover:text-primary-600">
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(memo.id)} className="text-gray-400 hover:text-red-600">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {memo.isEncrypted
                ? '🔒 加密内容'
                : (stripHtml(memo.content || '') || '当前没有内容')}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.isArray(memo.labels) && memo.labels.map((label) => (
                <span key={label} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded flex items-center">
                  <TagIcon className="w-3 h-3 mr-1" />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{format(new Date(memo.updatedAt), 'MM/dd HH:mm')}</span>
            </div>
          </div>
          ))
        )}
      </div>

      <MemoModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
        title={isEditModalOpen ? '编辑备忘录' : '新建备忘录'}
        formData={formData}
        setFormData={setFormData}
        onSubmit={isEditModalOpen ? handleEdit : handleCreate}
        addLabel={addLabel}
        removeLabel={removeLabel}
      />
    </div>
  );
}

function MemoModal({ isOpen, onClose, title, formData, setFormData, onSubmit, addLabel, removeLabel }: any) {
  const [labelInput, setLabelInput] = useState('');
  const handleAddLabel = () => { if (labelInput.trim()) { addLabel(labelInput.trim()); setLabelInput(''); } };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">{title}</Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="输入标题..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">内容</label>
                <RichTextEditor content={formData.content} onChange={(content) => setFormData({ ...formData, content })} placeholder="开始输入..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" placeholder="添加标签..." />
                  <button onClick={handleAddLabel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">添加</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.labels.map((label: string) => (
                    <span key={label} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg flex items-center gap-2">{label}<button onClick={() => removeLabel(label)} className="text-primary-600 hover:text-primary-800">×</button></span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">提醒时间</label>
                <input type="datetime-local" value={formData.reminderTime} onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isEncrypted} onChange={(e) => setFormData({ ...formData, isEncrypted: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">加密此备忘录</span>
                </label>
              </div>
              {formData.isEncrypted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">加密密码</label>
                  <input type="password" value={formData.encryptionPassword} onChange={(e) => setFormData({ ...formData, encryptionPassword: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="设置加密密码..." />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onSubmit} className="flex-1 px-4 py-2 rounded-lg btn-soft">保存</button>
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">取消</button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}


