import { useState, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import SmartAvatar from '@/components/Cosmetics/SmartAvatar';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api')
  ? String(API_BASE)
  : `${String(API_BASE).replace(/\/$/, '')}/api`;
const FILE_BASE = String(API_BASE).endsWith('/api')
  ? String(API_BASE).slice(0, -4)
  : String(API_BASE).replace(/\/$/, '');
const FALLBACK_AVATAR = '/default-avatar.png';

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return FALLBACK_AVATAR;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.includes('default-avatar')) return FALLBACK_AVATAR;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${FILE_BASE}${normalized}`;
};

const FRAME_STYLES: Record<string, CSSProperties> = {
  none: { border: '2px solid rgba(17,24,39,0.08)' },
  gold: { border: '3px solid #f59e0b', boxShadow: '0 0 12px #fbbf24' },
  pink: { border: '3px solid #f472b6', boxShadow: '0 0 12px #f472b6' },
  blue: { border: '3px solid #38bdf8', boxShadow: '0 0 12px #38bdf8' },
  green: { border: '3px solid #22c55e', boxShadow: '0 0 12px #22c55e' }
};

function HaloAvatar({
  src,
  frameStyle,
  size = 96
}: {
  src?: string | null;
  frameStyle?: CSSProperties;
  size?: number;
}) {
  const particles = useMemo(() => {
    const count = 22;
    return Array.from({ length: count }, (_, i) => {
      const a = Math.round((360 / count) * i + (Math.random() * 18 - 9));
      const r = 52 + Math.round(Math.random() * 10);
      const s = 1 + Math.random() * 1.4;
      const b = Math.round(2 + Math.random() * 8);
      const o = 0.25 + Math.random() * 0.65;
      const d = (Math.random() * 1.4).toFixed(2);
      const t = (2.2 + Math.random() * 2.6).toFixed(2);
      return {
        key: `p-${i}`,
        a: `${a}deg`,
        r: `${r}px`,
        s: s.toFixed(2),
        b: `${b}px`,
        o: o.toFixed(2),
        d: `${d}s`,
        t: `${t}s`
      };
    });
  }, []);

  return (
    <div className="relative group">
      <div className="pointer-events-none absolute -inset-6 rounded-full halo-field">
        {particles.map((p) => (
          <span
            key={p.key}
            className="halo-particle"
            style={
              {
                "--a": p.a,
                "--r": p.r,
                "--s": p.s,
                "--b": p.b,
                "--o": p.o,
                "--d": p.d,
                "--t": p.t
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="pointer-events-none absolute -inset-3 rounded-full halo-ring" />
      <div className="pointer-events-none absolute -inset-2 rounded-full halo-glow" />

      <div
        className="relative rounded-full p-[3px] shadow-inner"
        style={{ width: size, height: size, ...frameStyle }}
      >
        <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-white/40">
          {src ? (
            <img
              src={src}
              alt="avatar"
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200" />
          )}
        </div>
      </div>
    </div>
  );
}

interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  isConsultant: boolean;
  specialties: Array<{ name: string; experience: string; description: string }>;
  rating: number;
  totalBookings: number;
  completedBookings?: number;
  bookingRate?: number;
  reviewCount?: number;
  positiveReviewCount?: number;
  positiveRate?: number;
  weeklySchedule: any;
  pricingRules: Array<{ duration: number; price: number; discount?: any }>;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  images?: string[];
  reply?: string;
  createdAt: string;
  user: {
    username: string;
    avatar?: string;
  };
}

interface Post {
  id: string;
  userId: string;
  content: string;
  images: string[];
  videoUrl?: string | null;
  topics: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
    isVerified?: boolean;
  };
}

export default function ProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customFrame, setCustomFrame] = useState<string>('none');
  const { token, user } = useAuthStore();

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    fetchProfile();
    fetchReviews();
    fetchPosts();
  }, [userId]);

  useEffect(() => {
    if (!isOwnProfile) return;
    const savedAvatar =
      localStorage.getItem('dashboard_custom_avatar') ||
      localStorage.getItem('user_custom_avatar');
    const savedFrame =
      localStorage.getItem('dashboard_custom_frame') ||
      localStorage.getItem('user_custom_frame');
    if (savedAvatar) setCustomAvatar(savedAvatar);
    if (savedFrame) setCustomFrame(savedFrame);
  }, [isOwnProfile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data);
    } catch (error) {
      toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/booking/reviews/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(response.data);
    } catch (error) {
      console.error('获取评价失败:', error);
    }
  };

  const fetchPosts = async () => {
    if (!userId) return;
    try {
      setPostsLoading(true);
      const response = await axios.get(
        `${API_URL}/social/users/${userId}/posts`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, limit: 20, type: 'status' }
        }
      );
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('获取动态失败:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">用户不存在</p>
      </div>
    );
  }

  const headerAvatarRaw = isOwnProfile
    ? (customAvatar || profile.avatar || '')
    : (profile.avatar || '');
  const headerAvatarSrc = resolveAssetUrl(headerAvatarRaw);
  const haloAvatarSrc = resolveAssetUrl(customAvatar || profile.avatar || '');
  const bookingRateText =
    profile.totalBookings > 0
      ? `${Math.round((profile.bookingRate || 0) * 100)}%`
      : '暂无';
  const positiveRateText =
    profile.reviewCount && profile.reviewCount > 0
      ? `${Math.round((profile.positiveRate || 0) * 100)}%`
      : '暂无';
  const currentFrameStyle = FRAME_STYLES[customFrame] || FRAME_STYLES.none;
  const postTitle = isOwnProfile ? '你发布的动态' : `${profile.username} 的动态`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 个人信息卡片 */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 头像 */}
            <SmartAvatar
              src={headerAvatarSrc}
              alt={profile.username}
              className="w-32 h-32 rounded-full object-cover mx-auto md:mx-0"
              size={128}
              allowEdit={isOwnProfile}
            />

            {/* 基本信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
                {profile.isConsultant && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    认证咨询师
                  </span>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}

              {/* 统计信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.totalBookings}</p>
                  <p className="text-sm text-gray-500">预约次数</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{bookingRateText}</p>
                  <p className="text-sm text-gray-500">预约率</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{positiveRateText}</p>
                  <p className="text-sm text-gray-500">好评率</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                    {profile.rating?.toFixed(1) || '暂无'}
                    {profile.rating && (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">综合评分</p>
                </div>
              </div>

              {/* 操作按钮 */}
              {!isOwnProfile && profile.isConsultant && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:opacity-90 transition font-medium"
                >
                  立即预约
                </button>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">个性化展示</h2>
                  <p className="text-sm text-gray-500">仪表盘「个性化角」同步展示</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <HaloAvatar src={haloAvatarSrc} frameStyle={currentFrameStyle} />
                <div className="text-sm text-gray-600">
                  <p>你的个性化头像与边框会在这里展示。</p>
                  <p className="mt-1 text-xs text-gray-400">无需跳转到个性化页面即可查看。</p>
                </div>
              </div>
              <style>{`
                .halo-glow{
                  background: radial-gradient(circle at 50% 50%,
                    rgba(236,72,153,0.28) 0%,
                    rgba(236,72,153,0.10) 35%,
                    rgba(236,72,153,0.00) 70%);
                  filter: blur(10px);
                  opacity: 0.95;
                  transition: opacity .25s ease;
                }

                .halo-ring{
                  background:
                    conic-gradient(from 180deg,
                      rgba(236,72,153,0.00),
                      rgba(236,72,153,0.45),
                      rgba(255,255,255,0.35),
                      rgba(236,72,153,0.18),
                      rgba(236,72,153,0.00));
                  -webkit-mask: radial-gradient(circle,
                    transparent 54%,
                    rgba(0,0,0,1) 58%,
                    rgba(0,0,0,1) 68%,
                    transparent 72%);
                  mask: radial-gradient(circle,
                    transparent 54%,
                    rgba(0,0,0,1) 58%,
                    rgba(0,0,0,1) 68%,
                    transparent 72%);
                  filter: blur(1.2px);
                  animation: haloSpin 6s linear infinite;
                  opacity: 0.9;
                }

                .halo-field{
                  filter: blur(0.2px);
                }

                .halo-particle{
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  width: 6px;
                  height: 6px;
                  border-radius: 999px;
                  transform: rotate(var(--a)) translateX(var(--r)) scale(var(--s));
                  transform-origin: 0 0;
                  opacity: var(--o);
                  background: radial-gradient(circle at 30% 30%,
                    rgba(255,255,255,0.95) 0%,
                    rgba(236,72,153,0.65) 35%,
                    rgba(236,72,153,0.10) 70%,
                    rgba(236,72,153,0.00) 100%);
                  filter: blur(var(--b));
                  animation:
                    particleTwinkle var(--t) ease-in-out infinite,
                    particleDrift calc(var(--t) + 2s) ease-in-out infinite;
                  animation-delay: var(--d);
                }

                .group:hover .halo-glow{
                  opacity: 1;
                }
                .group:hover .halo-ring{
                  opacity: 1;
                  filter: blur(0.9px);
                }

                @keyframes haloSpin{
                  from{ transform: rotate(0deg); }
                  to{ transform: rotate(360deg); }
                }

                @keyframes particleTwinkle{
                  0%,100%{
                    opacity: calc(var(--o) * 0.45);
                    transform: rotate(var(--a)) translateX(var(--r)) scale(calc(var(--s) * 0.75));
                  }
                  50%{
                    opacity: calc(var(--o) * 1.15);
                    transform: rotate(var(--a)) translateX(calc(var(--r) + 6px)) scale(calc(var(--s) * 1.15));
                  }
                }

                @keyframes particleDrift{
                  0%,100%{
                    filter: blur(var(--b));
                  }
                  50%{
                    filter: blur(calc(var(--b) * 0.6));
                  }
                }
              `}</style>
            </div>
          )}

          {/* 技能展示区 */}
          {profile.specialties && profile.specialties.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">擅长技能</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.specialties.map((skill, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
                    <h3 className="font-semibold text-gray-900 mb-1">{skill.name}</h3>
                    <p className="text-sm text-primary-600 mb-2">{skill.experience}</p>
                    <p className="text-sm text-gray-600">{skill.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 收费标准 */}
          {profile.isConsultant && profile.pricingRules && profile.pricingRules.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">收费标准</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.pricingRules.map((rule, idx) => (
                  <div key={idx} className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-300 transition">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-primary-600">¥{rule.price}</span>
                      <span className="text-gray-500">/ {rule.duration}分钟</span>
                    </div>
                    {rule.discount && (
                      <p className="text-sm text-green-600">
                        {rule.discount.type === 'first_time' && `首次预约立减¥${rule.discount.amount}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 内容标签页 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'posts'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            动态
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'reviews'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            评价 ({reviews.length})
          </button>
        </div>

        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">{postTitle}</div>
            {postsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                <p className="mt-3 text-gray-500">加载中...</p>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500 py-12">暂无动态</p>
            ) : (
              posts.map((post) => {
                const postAvatarRaw = isOwnProfile
                  ? (customAvatar || profile.avatar || post.user.avatar || '')
                  : (post.user.avatar || '');
                const postAvatarSrc = resolveAssetUrl(postAvatarRaw);
                return (
                  <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={postAvatarSrc}
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
                              已认证
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    {post.content && (
                      <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>
                    )}

                    {post.images && post.images.length > 0 && (
                      <div
                        className={`grid gap-2 mb-4 ${
                          post.images.length === 1
                            ? 'grid-cols-1'
                            : post.images.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-3'
                        }`}
                      >
                        {post.images.map((img, idx) => (
                          <img
                            key={`${post.id}-img-${idx}`}
                            src={resolveAssetUrl(img)}
                            alt={`动态图片 ${idx + 1}`}
                            className="w-full h-40 object-cover rounded-xl"
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
                            key={`${post.id}-topic-${idx}`}
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
                      <Link
                        to={`/post/${post.id}`}
                        className="ml-auto text-primary-600 hover:text-primary-700"
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 评价列表 */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-12">暂无评价</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={resolveAssetUrl(review.user.avatar)}
                      alt={review.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{review.user.username}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{review.content}</p>
                      
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {review.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={resolveAssetUrl(img)}
                              alt={`评价图片 ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                      
                      {review.reply && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">咨询师回复：</p>
                          <p className="text-sm text-gray-700">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 预约弹窗 */}
      {showBookingModal && (
        <BookingModal
          consultant={profile}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}

// 预约弹窗组件
function BookingModal({ consultant, onClose }: { consultant: UserProfile; onClose: () => void }) {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const selectedPricing = consultant.pricingRules?.find(r => r.duration === selectedDuration);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !purpose.trim()) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/booking`,
        {
          consultantId: consultant.id,
          date: selectedDate,
          duration: selectedDuration,
          purpose,
          amount: selectedPricing?.price || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('预约成功！');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '预约失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">预约 {consultant.username}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 时长选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">选择时长</label>
              <div className="grid grid-cols-3 gap-3">
                {consultant.pricingRules?.map((rule) => (
                  <button
                    key={rule.duration}
                    type="button"
                    onClick={() => setSelectedDuration(rule.duration)}
                    className={`p-4 border-2 rounded-lg transition ${
                      selectedDuration === rule.duration
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{rule.duration}分钟</p>
                    <p className="text-primary-600 font-bold">¥{rule.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 日期选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
              <input
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* 学习需求 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学习需求 ({purpose.length}/300)
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                rows={4}
                placeholder="描述你想学习的内容..."
                maxLength={300}
                required
              />
            </div>

            {/* 总价 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">总计：</span>
                <span className="text-2xl font-bold text-primary-600">
                  ¥{selectedPricing?.price || 0}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
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
                {loading ? '提交中...' : '确认预约'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


