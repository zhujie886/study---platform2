import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useLanguage } from '@/i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api')
  ? String(API_BASE)
  : `${String(API_BASE).replace(/\/$/, '')}/api`;
const FILE_BASE = (import.meta.env.VITE_FILE_BASE_URL || API_URL).replace(/\/$/, '');
const FALLBACK_AVATAR = '/default-avatar.png';

type Post = {
  id: string;
  userId: string;
  content: string;
  images: string[];
  videoUrl?: string | null;
  topics: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  type?: 'question' | 'status';
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
    bio?: string | null;
    isVerified: boolean;
  };
};

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return FALLBACK_AVATAR;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.includes('default-avatar')) return FALLBACK_AVATAR;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${FILE_BASE}${normalized}`;
};

const svgToDataUrl = (svg: string) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

const buildPattern = (color: string, variant: 'hearts' | 'waves' | 'stars' | 'leaves' | 'dots') => {
  const fill = color.startsWith('#') ? color : '#f472b6';
  if (variant === 'hearts') {
    return {
      backgroundImage: svgToDataUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>
          <path fill='${fill}' fill-opacity='0.25' d='M30 24 C30 16 38 12 44 16 C48 12 56 12 60 18 C64 24 62 32 54 40 L44 50 L34 40 C32 38 30 32 30 24 Z' />
          <path fill='${fill}' fill-opacity='0.18' d='M88 68 C88 60 96 56 102 60 C106 56 114 56 118 62 C122 68 120 76 112 84 L102 94 L92 84 C90 82 88 76 88 68 Z' />
        </svg>`
      ),
      backgroundSize: '140px 140px',
      opacity: 0.45
    };
  }

  if (variant === 'waves') {
    return {
      backgroundImage: svgToDataUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'>
          <path d='M0 26 Q20 14 40 26 T80 26 T120 26 T160 26' stroke='${fill}' stroke-opacity='0.35' stroke-width='2' fill='none' />
          <path d='M0 64 Q20 52 40 64 T80 64 T120 64 T160 64' stroke='${fill}' stroke-opacity='0.25' stroke-width='2' fill='none' />
          <path d='M0 100 Q20 88 40 100 T80 100 T120 100 T160 100' stroke='${fill}' stroke-opacity='0.2' stroke-width='2' fill='none' />
        </svg>`
      ),
      backgroundSize: '160px 120px',
      opacity: 0.5
    };
  }

  if (variant === 'stars') {
    return {
      backgroundImage: svgToDataUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>
          <path fill='${fill}' fill-opacity='0.35' d='M28 8 L32 22 L46 22 L35 30 L40 44 L28 36 L16 44 L21 30 L10 22 L24 22 Z' />
          <path fill='${fill}' fill-opacity='0.25' d='M92 64 L96 76 L108 76 L98 84 L102 96 L92 88 L82 96 L86 84 L76 76 L88 76 Z' />
          <circle cx='118' cy='24' r='3' fill='${fill}' fill-opacity='0.4' />
          <circle cx='56' cy='96' r='4' fill='${fill}' fill-opacity='0.2' />
        </svg>`
      ),
      backgroundSize: '140px 140px',
      opacity: 0.45
    };
  }

  if (variant === 'leaves') {
    return {
      backgroundImage: svgToDataUrl(
        `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>
          <path fill='${fill}' fill-opacity='0.25' d='M32 92 C46 64 76 56 100 60 C96 82 72 102 48 106 C40 102 34 98 32 92 Z' />
          <path fill='${fill}' fill-opacity='0.18' d='M92 30 C106 26 120 30 130 40 C122 54 104 66 88 66 C86 58 86 42 92 30 Z' />
          <path d='M44 94 L66 78' stroke='${fill}' stroke-opacity='0.35' stroke-width='2' fill='none' />
        </svg>`
      ),
      backgroundSize: '140px 140px',
      opacity: 0.45
    };
  }

  return {
    backgroundImage: svgToDataUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
        <circle cx='18' cy='18' r='3' fill='${fill}' fill-opacity='0.28' />
        <circle cx='68' cy='34' r='2.5' fill='${fill}' fill-opacity='0.2' />
        <circle cx='40' cy='78' r='3' fill='${fill}' fill-opacity='0.18' />
        <circle cx='96' cy='92' r='2.5' fill='${fill}' fill-opacity='0.25' />
      </svg>`
    ),
    backgroundSize: '120px 120px',
    opacity: 0.35
  };
};

export default function SocialPage() {
  const { theme } = useThemeStore();
  const { t, lang } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'mine' | 'public'>('mine');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const { user, token } = useAuthStore();

  const displayName = user?.username || user?.email || t('访客');
  const displayBio = user?.username ? t('写点什么来展示自己吧') : t('登录后发布动态');

  useEffect(() => {
    const savedAvatar =
      localStorage.getItem('user_custom_avatar') ||
      localStorage.getItem('dashboard_custom_avatar');
    setLocalAvatar(savedAvatar);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar, localAvatar]);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/social/posts`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { filter, page: 1, limit: 20, type: 'status' }
      });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error(t('获取动态失败:'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        await axios.delete(`${API_URL}/social/posts/${postId}/like`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(
          `${API_URL}/social/posts/${postId}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setPosts((prev) =>
        prev.map((item) => {
          if (item.id !== postId) return item;
          const currentLikeCount = Number(item.likeCount || 0);
          return {
            ...item,
            isLiked: !item.isLiked,
            likeCount: item.isLiked ? currentLikeCount - 1 : currentLikeCount + 1
          };
        })
      );
    } catch (error) {
      toast.error(t('操作失败'));
    }
  };

  const postCount = useMemo(() => posts.length, [posts]);
  const headerAvatarRaw = localAvatar || user?.avatar || '';
  const headerAvatarSrc = headerAvatarRaw ? resolveAssetUrl(headerAvatarRaw) : '';
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const ownUserId = user?.id;
  const getPostAvatarSrc = (post: Post) => {
    const raw = post.user.id === ownUserId
      ? (localAvatar || user?.avatar || post.user.avatar || '')
      : (post.user.avatar || '');
    return raw ? resolveAssetUrl(raw) : '';
  };
  const getProfileLink = (post: Post) => `/profile/${post.user.id}`;
  const heroPatternStyle = useMemo(() => {
    const name = theme.name.toLowerCase();
    const accent = theme.styles?.['--primary-color'] || '#f472b6';
    if (name.includes('sakura')) return buildPattern(accent, 'hearts');
    if (name.includes('ocean') || name.includes('monet')) return buildPattern(accent, 'waves');
    if (name.includes('forest')) return buildPattern(accent, 'leaves');
    if (name.includes('van gogh') || name.includes('cyber') || name.includes('nebula')) {
      return buildPattern(accent, 'stars');
    }
    return buildPattern(accent, 'dots');
  }, [theme]);

  const renderImageGrid = (images: string[]) => {
    if (!images || images.length === 0) return null;
    const preview = images.slice(0, 4);
    const extra = images.length - preview.length;

    if (images.length === 1) {
      return (
        <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
          <img
            src={resolveAssetUrl(preview[0])}
            alt={t('动态图片')}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-1 bg-slate-100/60">
        {preview.map((img, idx) => (
          <div key={img + idx} className="relative aspect-square overflow-hidden bg-slate-100">
            <img
              src={resolveAssetUrl(img)}
              alt={t('动态图片 {index}', { index: idx + 1 })}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            {extra > 0 && idx === preview.length - 1 && (
              <div className="absolute inset-0 bg-black/45 text-white flex items-center justify-center text-xl font-semibold">
                +{extra}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderVideoCard = (url: string) => (
    <div className="relative aspect-[4/5] bg-black/80 overflow-hidden">
      <video
        src={resolveAssetUrl(url)}
        controls
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white bg-black/60">
        {t('视频')}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative overflow-hidden border-b"
        style={{
          background: 'color-mix(in srgb, var(--background-main) 70%, var(--primary-color) 12%)',
          borderColor: 'var(--panel-border, rgba(148,163,184,0.2))'
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={heroPatternStyle}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow"
                style={{ background: 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #ffffff 30%))' }}
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('发布动态')}</h1>
                <p className="text-sm text-gray-600">{t('展示自己 · 记录当下')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 btn-soft rounded-full shadow-sm hover:shadow-md transition"
            >
              <PlusIcon className="w-5 h-5" />
              {t('发布动态')}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
            <div className="rounded-2xl p-4 shadow-sm flex items-center gap-4"
              style={{
                background: 'color-mix(in srgb, var(--panel-bg, #ffffff) 75%, transparent)',
                border: '1px solid var(--panel-border, rgba(148,163,184,0.2))'
              }}
            >
              <div className="relative">
                {headerAvatarSrc && !avatarError ? (
                  <img
                    src={headerAvatarSrc}
                    alt={displayName}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full text-white flex items-center justify-center text-lg font-semibold ring-2 ring-white"
                    style={{ background: 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 60%, #ffffff 40%))' }}
                  >
                    {displayInitial}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white shadow">
                  <SparklesIcon className="w-4 h-4 text-rose-500" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-gray-900 truncate">{displayName}</div>
                <div className="text-sm text-gray-500 truncate">{displayBio}</div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full btn-soft text-sm"
              >
                <PencilSquareIcon className="w-4 h-4" />
                {t('记录此刻')}
              </button>
            </div>

            <div className="rounded-2xl p-4 shadow-sm flex items-center justify-between"
              style={{
                background: 'color-mix(in srgb, var(--panel-bg, #ffffff) 75%, transparent)',
                border: '1px solid var(--panel-border, rgba(148,163,184,0.2))'
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilter('mine')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                    filter === 'mine'
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  style={filter === 'mine'
                    ? { background: 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #ffffff 30%))' }
                    : { background: 'color-mix(in srgb, var(--panel-bg, #ffffff) 80%, transparent)', border: '1px solid var(--panel-border, rgba(148,163,184,0.2))' }
                  }
                >
                  <UserCircleIcon className="w-4 h-4" />
                  {t('我的动态')}
                </button>
                <button
                  onClick={() => setFilter('public')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                    filter === 'public'
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  style={filter === 'public'
                    ? { background: 'linear-gradient(135deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 70%, #ffffff 30%))' }
                    : { background: 'color-mix(in srgb, var(--panel-bg, #ffffff) 80%, transparent)', border: '1px solid var(--panel-border, rgba(148,163,184,0.2))' }
                  }
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  {t('公开广场')}
                </button>
              </div>
              <span className="text-xs text-gray-500">{t('共 {count} 条', { count: postCount })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            <p className="mt-4 text-gray-500">{t('加载中...')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <PencilSquareIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-700">{t('暂无动态，发布你的第一条动态吧')}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full shadow-sm hover:shadow-md"
            >
              <PlusIcon className="w-5 h-5" />
              {t('发布动态')}
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="break-inside-avoid mb-4">
                <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                  {post.images && post.images.length > 0 && renderImageGrid(post.images)}
                  {!post.images?.length && post.videoUrl && renderVideoCard(post.videoUrl)}

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Link to={getProfileLink(post)}>
                        <img
                          src={getPostAvatarSrc(post)}
                          alt={post.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = FALLBACK_AVATAR;
                          }}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={getProfileLink(post)} className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 hover:text-primary-600 truncate">
                            {post.user.username}
                          </span>
                          {post.user.isVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                              {t('已认证')}
                            </span>
                          )}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    {post.content && (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {post.content}
                      </p>
                    )}

                    {post.topics && post.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition ${
                          post.isLiked ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                        }`}
                      >
                        <HeartIcon className="w-5 h-5" />
                        <span className="text-sm">{post.likeCount}</span>
                      </button>

                      <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition">
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        <span className="text-sm">{post.commentCount}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchPosts}
        />
      )}
    </div>
  );
}

type CreatePostModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

function CreatePostModal({ onClose, onSuccess }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoName, setVideoName] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && images.length === 0 && !videoUrl.trim()) {
      toast.error(t('动态内容不能为空'));
      return;
    }

    if (imageUploading || videoUploading) {
      toast.error(t('请等待文件上传完成'));
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/social/posts`,
        {
          content,
          topics,
          visibility,
          images,
          videoUrl: videoUrl.trim() || null,
          type: 'status'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t('发布成功'));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(t('发布失败'));
    } finally {
      setLoading(false);
    }
  };

  const addTopic = () => {
    const value = topicInput.trim();
    if (!value || topics.includes(value) || topics.length >= 5) return;
    setTopics((prev) => [...prev, value]);
    setTopicInput('');
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (images.length + fileList.length > 9) {
      toast.error(t('最多上传 9 张图片'));
      return;
    }

    try {
      setImageUploading(true);
      const formData = new FormData();
      fileList.forEach((file) => formData.append('images', file));
      const response = await axios.post(`${API_URL}/upload/post/images`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const uploaded = (response.data.images || [])
        .map((item: { url?: string }) => item.url)
        .filter(Boolean) as string[];
      if (uploaded.length === 0) {
        toast.error(t('图片上传失败'));
        return;
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (error) {
      toast.error(t('图片上传失败'));
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((item) => item !== url));
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;

    try {
      setVideoUploading(true);
      const formData = new FormData();
      formData.append('video', file);
      const response = await axios.post(`${API_URL}/upload/video`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.data.url) {
        toast.error(t('视频上传失败'));
        return;
      }
      setVideoUrl(response.data.url);
      setVideoName(file.name);
    } catch (error) {
      toast.error(t('视频上传失败'));
    } finally {
      setVideoUploading(false);
    }
  };

  const clearVideo = () => {
    setVideoUrl('');
    setVideoName('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('发布动态')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('动态内容 ({count}/500)', { count: content.length })}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={6}
                placeholder={t('写下今天的想法、进展或心得...')}
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('可见范围')}</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'followers' | 'private')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="public">{t('公开广场')}</option>
                <option value="followers">{t('仅关注者')}</option>
                <option value="private">{t('仅自己')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('话题标签（最多 5 个）')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTopic();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder={t('输入话题标签')}
                  disabled={topics.length >= 5}
                />
                <button
                  type="button"
                  onClick={addTopic}
                  disabled={topics.length >= 5}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50"
                >
                  {t('添加')}
                </button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                    >
                      #{topic}
                      <button
                        type="button"
                        onClick={() => setTopics(topics.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('上传图片（可选）')}</label>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${imageUploading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer`}>
                  <PhotoIcon className="w-5 h-5" />
                  {imageUploading ? t('上传中...') : t('选择图片')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={imageUploading}
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </label>
                <span className="text-xs text-gray-500">{t('最多 9 张，大小不限（建议压缩以加快加载）')}</span>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div key={img} className="relative group">
                      <img
                        src={resolveAssetUrl(img)}
                        alt={t('上传图片')}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('上传视频（可选）')}</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${videoUploading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer`}>
                  <PhotoIcon className="w-5 h-5" />
                  {videoUploading ? t('上传中...') : t('选择视频')}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={videoUploading}
                    onChange={(e) => handleVideoUpload(e.target.files?.[0] || null)}
                  />
                </label>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {t('移除视频')}
                  </button>
                )}
                <span className="text-xs text-gray-500">{t('大小不限（建议压缩以加快加载）')}</span>
              </div>
              {videoUrl && (
                <div className="mt-3">
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <video src={resolveAssetUrl(videoUrl)} controls className="w-full" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{t('已上传：{name}', { name: videoName || videoUrl })}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('取消')}
              </button>
              <button
                type="submit"
                disabled={loading || imageUploading || videoUploading}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? t('发布中...') : (imageUploading || videoUploading ? t('上传中...') : t('发布动态'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
