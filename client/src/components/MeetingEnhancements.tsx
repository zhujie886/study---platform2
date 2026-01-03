/**
 * 会议增强组件集合
 * 包含：创建会议弹窗、弹幕组件
 */

import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  LinkIcon,
  ClockIcon,
  LockClosedIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

// ========== 创建会议弹窗 ==========

interface CreateMeetingModalProps {
  onClose: () => void;
  onSuccess: (room: any) => void;
  invitedUsers?: string[];
}

export function CreateMeetingModal({ onClose, onSuccess, invitedUsers = [] }: CreateMeetingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    password: '',
    customLinkName: '',
    linkType: 'permanent',
    joinPermission: 'invited',
    scheduledAt: ''
  });
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('请输入会议标题');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/meeting/create-with-link`,
        {
          ...formData,
          invitedUserIds: invitedUsers
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('会议创建成功！');
      onSuccess(response.data);
      onClose();
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">创建会议</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 会议标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              会议标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如：Python基础教学"
              required
            />
          </div>

          {/* 会议描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              会议描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="简单介绍会议内容..."
            />
          </div>

          {/* 链接设置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                链接有效期
              </label>
              <select
                value={formData.linkType}
                onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="permanent">永久有效</option>
                <option value="24h">24小时内有效</option>
                <option value="once">单次有效</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4" />
                加入权限
              </label>
              <select
                value={formData.joinPermission}
                onChange={(e) => setFormData({ ...formData, joinPermission: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="invited">仅受邀者</option>
                <option value="approval">需要审核</option>
                <option value="public">公开可加入</option>
              </select>
            </div>
          </div>

          {/* 会议密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <LockClosedIcon className="w-4 h-4" />
              会议密码（可选）
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="输入会议密码"
            />
          </div>

          {/* 预定时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              预定时间（可选）
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">留空则立即开始会议</p>
          </div>

          {/* 邀请用户提示 */}
          {invitedUsers.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                已选择邀请 <span className="font-semibold">{invitedUsers.length}</span> 位用户
              </p>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? '创建中...' : '创建会议'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== 弹幕组件 ==========

interface BarrageComponentProps {
  roomId: string;
  barrages: Array<{
    id: string;
    username: string;
    content: string;
    colorHash: string;
    isPinned: boolean;
    mentionUserId?: string;
  }>;
  currentUserId?: string;
}

export function BarrageComponent({ roomId, barrages, currentUserId }: BarrageComponentProps) {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { token } = useAuthStore();

  const sendBarrage = async () => {
    if (!inputValue.trim() || inputValue.length > 50) {
      toast.error('弹幕内容不能为空且不超过50字');
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/meeting/barrages`,
        {
          roomId,
          content: inputValue.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInputValue('');
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('发送太频繁，请稍后再试');
      } else {
        toast.error('发送失败');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBarrage();
    }
  };

  // 置顶弹幕
  const pinnedBarrages = barrages.filter(b => b.isPinned);
  // 普通弹幕
  const normalBarrages = barrages.filter(b => !b.isPinned);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* 置顶弹幕区域 */}
      {pinnedBarrages.length > 0 && (
        <div className="bg-yellow-500 bg-opacity-90 text-white py-2 px-4 text-center font-bold pointer-events-auto">
          📌 {pinnedBarrages[0].content}
        </div>
      )}

      {/* 滚动弹幕区域 */}
      <div className="relative h-64 overflow-hidden">
        {normalBarrages.slice(-20).map((barrage, index) => (
          <div
            key={barrage.id}
            className="absolute animate-barrage-scroll whitespace-nowrap text-lg font-medium shadow-lg px-3 py-1 rounded-full pointer-events-auto"
            style={{
              top: `${(index % 8) * 32}px`,
              right: '-100%',
              color: barrage.colorHash,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              animationDelay: `${index * 0.5}s`,
              animationDuration: '10s'
            }}
          >
            <span className="font-semibold">{barrage.username}:</span> {barrage.content}
          </div>
        ))}
      </div>

      {/* 弹幕输入框 */}
      <div className="bg-white bg-opacity-95 border-t border-gray-200 p-4 pointer-events-auto">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-600" />
          </button>

          {isExpanded && (
            <>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="发送弹幕... (最多50字)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={50}
              />
              <button
                onClick={sendBarrage}
                disabled={!inputValue.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                发送
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


