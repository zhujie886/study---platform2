import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import AvailableSlotsPanel from '@/components/AvailableSlotsPanel';
import { useLanguage } from '@/i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api')
  ? String(API_BASE)
  : `${String(API_BASE).replace(/\/$/, '')}/api`;
const FILE_BASE = (import.meta.env.VITE_FILE_BASE_URL || API_URL).replace(/\/$/, '');
const FALLBACK_AVATAR = '/default-avatar.png';

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return FALLBACK_AVATAR;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.includes('default-avatar')) return FALLBACK_AVATAR;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${FILE_BASE}${normalized}`;
};

type User = {
  id: string;
  username: string;
  avatar?: string | null;
  isVerified?: boolean;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: User;
};

type Post = {
  id: string;
  content: string;
  images: string[];
  videoUrl?: string | null;
  topics: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: User;
  comments?: Comment[];
};

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale);
}

export default function PostDetailPage() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const { t, lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/social/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost(response.data);
    } catch (error) {
      console.error(t('post.load_failed'), error);
      toast.error(t('post.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    const trimmed = commentContent.trim();
    if (!trimmed) {
      toast.error(t('post.comment_empty'));
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}/social/posts/${id}/comments`,
        { content: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('post.comment_success'));
      setCommentContent('');
      await fetchPost();
    } catch (error) {
      console.error(t('post.comment_failed'), error);
      toast.error(t('post.comment_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <p className="mt-4 text-gray-500">{t('post.loading')}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">{t('post.not_found')}</p>
          <Link to="/social" className="mt-4 inline-flex items-center gap-2 btn-soft px-3 py-1.5 rounded-full text-sm relative z-10">
            <ArrowLeftIcon className="w-4 h-4" />
            {t('post.back_to_social')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/social" className="inline-flex items-center gap-2 btn-soft px-3 py-1.5 rounded-full text-sm relative z-10">
          <ArrowLeftIcon className="w-4 h-4" />
          {t('post.back_to_social')}
        </Link>

        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={resolveAssetUrl(post.user.avatar)}
              alt={post.user.username}
              className="w-12 h-12 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_AVATAR;
              }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{post.user.username}</span>
                {post.user.isVerified && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {t('post.verified')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt, locale)}</p>
            </div>
          </div>

          {post.content && (
            <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>
          )}

          {post.images && post.images.length > 0 && (
            <div
              className={`grid gap-2 mb-4 ${
                post.images.length === 1 ? 'grid-cols-1' :
                post.images.length === 2 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}
            >
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={resolveAssetUrl(img)}
                  alt={t('post.image_alt', { count: idx + 1 })}
                  className="w-full h-48 object-cover rounded-xl"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}

          {post.videoUrl && (
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
              <video src={resolveAssetUrl(post.videoUrl)} controls className="w-full" />
            </div>
          )}

          {post.topics && post.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-rose-500" />
              {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
              {post.commentCount}
            </span>
            <span>{t('post.view_count', { count: post.viewCount })}</span>
          </div>
        </div>

        <AvailableSlotsPanel
          userId={post.user?.id}
          title={t('post.slots_title')}
        />

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('post.comment_title')}</h2>
          <form onSubmit={handleCommentSubmit} className="mt-4 space-y-4">
            <textarea
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              rows={4}
              placeholder={t('post.comment_placeholder')}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? t('post.submitting') : t('post.submit_comment')}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('post.comments_title')}</h2>
            <span className="text-sm text-gray-500">{t('post.count_label', { count: post.comments?.length || 0 })}</span>
          </div>

          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={resolveAssetUrl(comment.user?.avatar)}
                    alt={comment.user?.username}
                    className="w-9 h-9 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_AVATAR;
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{comment.user?.username}</div>
                    <div className="text-xs text-gray-400">{formatDate(comment.createdAt, locale)}</div>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-500">
              {t('post.no_comments')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
