/**
 * 用户卡片组件
 * 点击任何头像触发，整合社交+会议功能
 */

import { useState, useEffect } from 'react';
import SmartAvatar from './Cosmetics/SmartAvatar';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  CheckIcon,
  EnvelopeIcon,
  UserPlusIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface UserCardProps {
  userId: string;
  onClose: () => void;
  onInviteToMeeting?: (userId: string) => void;
}

interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  isConsultant: boolean;
  isVerified: boolean;
  isFollowing?: boolean;
  recentMeetings?: Array<{
    id: string;
    title: string;
    scheduledAt: string;
  }>;
}

export default function UserCard({ userId, onClose, onInviteToMeeting }: UserCardProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { token, user: currentUser } = useAuthStore();
  const { t, lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const [userRes, followRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/follow/users/${userId}/follow/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUser({
        ...userRes.data,
        isFollowing: followRes.data.isFollowing
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast.error(t('加载失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      if (user.isFollowing) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/follow/users/${userId}/follow`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(t('已取消关注'));
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/follow/users/${userId}/follow`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(t('关注成功'));
      }
      setUser({ ...user, isFollowing: !user.isFollowing });
    } catch (error) {
      toast.error(t('操作失败'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = () => {
    // 跳转到私信页面（待实现）
    toast.success(t('正在打开私信对话...'));
    onClose();
  };

  const handleInviteToMeeting = () => {
    if (onInviteToMeeting) {
      onInviteToMeeting(userId);
      onClose();
    } else {
      toast.success(t('会议邀请功能开发中...'));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn">
        {/* 头部 */}
        <div className="relative p-6 bg-gradient-to-r from-primary-500 to-secondary-500">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <SmartAvatar src={user.avatar || "/default-avatar.png"} alt={user.username} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg object-cover" size={96} allowEdit={isOwnProfile} />
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
              {user.username}
              {user.isVerified && (
                <CheckIcon className="w-6 h-6 text-blue-300" />
              )}
            </h2>
            {user.isConsultant && (
              <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-medium">
                {t('认证咨询师')}
              </span>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 个人简介 */}
          {user.bio && (
            <p className="text-gray-700 mb-6 text-center">{user.bio}</p>
          )}

          {/* 操作按钮 */}
          {!isOwnProfile && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleFollow}
                  disabled={actionLoading}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                    user.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:opacity-90'
                  } disabled:opacity-50`}
                >
                  <UserPlusIcon className="w-5 h-5" />
                  {user.isFollowing ? t('已关注') : t('关注')}
                </button>

                <button
                  onClick={handleSendMessage}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                  {t('发私信')}
                </button>
              </div>

              <button
                onClick={handleInviteToMeeting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium mb-4"
              >
                <VideoCameraIcon className="w-5 h-5" />
                {t('发起会议邀请')}
              </button>
            </>
          )}

          {/* 近期会议 */}
          {user.recentMeetings && user.recentMeetings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('近期会议')}</h3>
              <div className="space-y-2">
                {user.recentMeetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {meeting.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(meeting.scheduledAt).toLocaleString(locale)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 查看完整主页 */}
          <Link
            to={`/profile/${userId}`}
            onClick={onClose}
            className="block mt-6 text-center text-primary-600 hover:text-primary-700 font-medium transition"
          >
            {t('查看完整主页 →')}
          </Link>
        </div>
      </div>
    </div>
  );
}




