import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { qaAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/i18n/LanguageContext';

type Category = {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

type Tag = {
  id: string;
  name: string;
  description?: string | null;
  isApproved?: boolean;
};

type Attachment = {
  id?: string;
  url: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
  type?: string | null;
};

type User = {
  id?: string | null;
  username: string;
  avatar?: string | null;
  isVerified?: boolean;
  isAnonymous?: boolean;
};

type Question = {
  id: string;
  title: string;
  content: string;
  contentFormat: string;
  isAnonymous: boolean;
  status: string;
  viewCount: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  user: User | null;
  category: Category;
  tags: Tag[];
  attachments: Attachment[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_LABELS: Record<string, string> = {
  open: '未解决',
  resolved: '已解决',
  closed: '已关闭'
};

const DEFAULT_LIMIT = 12;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api')
  ? String(API_BASE)
  : `${String(API_BASE).replace(/\/$/, '')}/api`;
const FILE_BASE = (import.meta.env.VITE_FILE_BASE_URL || API_URL).replace(/\/$/, '');
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;

const resolveAssetUrl = (value?: string | null) => {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${FILE_BASE}${normalized}`;
};

const isImageAttachment = (attachment: Attachment) => {
  const mime = attachment.mimeType || attachment.type || '';
  if (mime.startsWith('image/')) return true;
  return IMAGE_EXT.test(attachment.url || '');
};

export default function CommunityPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('latest');
  const [tagFilter, setTagFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { t, lang } = useLanguage();

  const statusOptions = useMemo(() => (
    [
      { value: 'all', label: t('全部状态') },
      { value: 'open', label: t('未解决') },
      { value: 'resolved', label: t('已解决') },
      { value: 'closed', label: t('已关闭') }
    ]
  ), [t]);

  const sortOptions = useMemo(() => (
    [
      { value: 'latest', label: t('最新') },
      { value: 'hot', label: t('最热') }
    ]
  ), [t]);

  const fallbackCategories = useMemo(() => (
    [
      { id: '数学', name: t('数学') },
      { id: '语言', name: t('语言') },
      { id: '计算机', name: t('计算机') },
      { id: '金融', name: t('金融') },
      { id: '考研', name: t('考研') },
      { id: '面试', name: t('面试') }
    ]
  ), [t]);

  const categoryOptions = useMemo(
    () => [{ id: 'all', name: t('全部领域') }, ...categories],
    [categories, t]
  );

  const formatDate = (value: string) => new Date(value).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');

  const getSnippet = (text: string, limit = 140) => {
    const plain = text.trim().replace(/\s+/g, ' ');
    if (plain.length <= limit) return plain;
    return `${plain.slice(0, limit)}...`;
  };

  const getDisplayName = (user: User | null, isAnonymous?: boolean) => {
    if (isAnonymous || user?.isAnonymous) return t('匿名用户');
    return user?.username || t('匿名用户');
  };

  const renderAttachmentGrid = (urls: string[]) => {
    if (!urls || urls.length === 0) return null;
    const preview = urls.slice(0, 4);
    const extra = urls.length - preview.length;

    if (urls.length === 1) {
      return (
        <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
          <img
            src={resolveAssetUrl(preview[0])}
            alt={t('附件图片')}
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
        {preview.map((url, idx) => (
          <div key={`${url}-${idx}`} className="relative aspect-square overflow-hidden bg-slate-100">
            <img
              src={resolveAssetUrl(url)}
              alt={t('附件图片 {index}', { index: idx + 1 })}
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await qaAPI.listCategories();
        setCategories(response.data.data || []);
      } catch (error) {
        console.error(t('加载分类失败'), error);
      }
    };

    loadCategories();
  }, [t]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          page,
          limit: DEFAULT_LIMIT,
          sort
        };
        if (categoryId !== 'all') params.categoryId = categoryId;
        if (status !== 'all') params.status = status;
        if (tagFilter) params.tag = tagFilter;
        if (search) params.q = search;

        const response = await qaAPI.listQuestions(params);
        setQuestions(response.data.data || []);
        setPagination(response.data.pagination || null);
      } catch (error) {
        console.error(t('获取问题失败'), error);
        toast.error(t('加载问题失败'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [categoryId, status, sort, tagFilter, search, page, refreshKey, t]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleTagClick = (tag: string) => {
    setTagFilter(tag);
    setPage(1);
  };

  const handleClearTag = () => {
    setTagFilter('');
    setPage(1);
  };

  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('提问广场')}</h1>
                <p className="text-sm text-gray-500">{t('真实问题 · 真实解答')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              {t('发布提问')}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('搜索标题或正文')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-white">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    setPage(1);
                  }}
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-white">
                <TagIcon className="w-5 h-5 text-gray-400" />
                <select
                  className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-white">
                <select
                  className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {tagFilter && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('标签筛选:')}</span>
              <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-primary-100 text-primary-700">
                #{tagFilter}
                <button
                  type="button"
                  onClick={handleClearTag}
                  className="text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            <p className="mt-4 text-gray-500">{t('加载中...')}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-700">{t('暂时没有匹配的问题')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('换个筛选条件或发布你的第一个问题吧')}</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {questions.map((question) => {
              const imageAttachments = (question.attachments || [])
                .filter(isImageAttachment)
                .map((item) => item.url)
                .filter(Boolean);

              return (
                <div key={question.id} className="break-inside-avoid mb-4">
                  <Link
                    to={`/community/${question.id}`}
                    className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    {imageAttachments.length > 0 && (
                      <div className="overflow-hidden rounded-t-2xl">
                        {renderAttachmentGrid(imageAttachments)}
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${question.status === 'resolved' ? 'bg-green-100 text-green-700' : question.status === 'closed' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                            {t(STATUS_LABELS[question.status] || '未解决')}
                          </span>
                          <span className="text-xs text-gray-500">{question.category?.name || t('未分类')}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(question.createdAt)}</span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900">
                        {question.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{getSnippet(question.content)}</p>

                      {question.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {question.tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                handleTagClick(tag.name);
                              }}
                              className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition"
                            >
                              #{tag.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <span>{t('回答 {count}', { count: question.answerCount })}</span>
                          <span>{t('浏览 {count}', { count: question.viewCount })}</span>
                        </div>
                        <span>{getDisplayName(question.user, question.isAnonymous)}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
            >
              {t('上一页')}
            </button>
            <span className="text-sm text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
            >
              {t('下一页')}
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateQuestionModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            setPage(1);
            setSearch('');
            setSearchInput('');
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}

type CreateQuestionModalProps = {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
};

type AttachmentInput = {
  url: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
  type?: string;
};

function CreateQuestionModal({ categories, onClose, onSuccess }: CreateQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<Question[]>([]);
  const { token } = useAuthStore();
  const { t } = useLanguage();
  const categoryOptions = categories.length > 0 ? categories : useMemo(() => ([
    { id: '数学', name: t('数学') },
    { id: '语言', name: t('语言') },
    { id: '计算机', name: t('计算机') },
    { id: '金融', name: t('金融') },
    { id: '考研', name: t('考研') },
    { id: '面试', name: t('面试') }
  ]), [t]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = tagInput.trim();
      if (!query) {
        setTagSuggestions([]);
        return;
      }

      try {
        const response = await qaAPI.listTags({ q: query });
        setTagSuggestions(response.data.data || []);
      } catch (error) {
        console.error(t('加载标签失败'), error);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [tagInput, t]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = title.trim();
      if (query.length < 5) {
        setSimilarQuestions([]);
        return;
      }
      try {
        const response = await qaAPI.listQuestions({ q: query, page: 1, limit: 5 });
        setSimilarQuestions(response.data.data || []);
      } catch (error) {
        console.error(t('加载相似问题失败'), error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [title, t]);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    if (tags.length >= 5) {
      toast.error(t('最多添加 5 个标签'));
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((item) => item.url !== url));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!token) {
      toast.error(t('请先登录后上传附件'));
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const response = await axios.post(`${API_URL}/upload/attachments`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const uploaded = (response.data.files || [])
        .map((item: any) => ({
          url: item.url,
          name: item.name || null,
          size: item.size ?? null,
          mimeType: item.mimeType ?? null,
          type: item.type || 'file'
        }))
        .filter((item: any) => item.url);
      if (uploaded.length === 0) {
        toast.error(t('附件上传失败'));
        return;
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error(t('附件上传失败'), error);
      toast.error(t('附件上传失败'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (trimmedTitle.length < 5 || trimmedTitle.length > 80) {
      toast.error(t('标题需要 5-80 字'));
      return;
    }

    if (trimmedContent.length < 30) {
      toast.error(t('正文至少 30 字'));
      return;
    }

    const effectiveTags = tags.length > 0
      ? tags
      : (tagInput.trim() ? [tagInput.trim()] : []);

    if (!categoryId) {
      toast.error(t('请选择领域分类'));
      return;
    }

    if (effectiveTags.length === 0) {
      toast.error(t('请至少添加 1 个标签'));
      return;
    }

    if (uploading) {
      toast.error(t('请等待附件上传完成'));
      return;
    }

    try {
      setLoading(true);
      await qaAPI.createQuestion({
        title: trimmedTitle,
        content: trimmedContent,
        contentFormat: 'markdown',
        categoryId,
        tags: effectiveTags,
        attachments,
        isAnonymous
      });
      toast.success(t('提问已发布'));
      onSuccess();
    } catch (error) {
      console.error(t('发布提问失败'), error);
      const message = (error as any)?.response?.data?.error || t('发布失败');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('发布提问')}</h2>
              <p className="text-sm text-gray-500">{t('把问题描述清楚，更容易获得好答案')}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('标题')}</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('5-80 字，概括你的问题')}
                maxLength={80}
                required
              />
              {similarQuestions.length > 0 && (
                <div className="mt-3 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
                  <div className="text-sm font-semibold text-primary-700">{t('可能相关的问题')}</div>
                  <div className="mt-2 space-y-2">
                    {similarQuestions.map((item) => (
                      <Link
                        key={item.id}
                        to={`/community/${item.id}`}
                        className="block text-sm text-primary-700 hover:text-primary-900"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('正文')}</label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={8}
                placeholder={t('支持 Markdown。请描述背景、遇到的问题、已尝试的办法。')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">
                {t('领域分类')}
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">{t('请选择领域')}</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <div className="mt-2 text-xs text-rose-500">
                    {t('暂无可选领域，已使用默认领域选项')}
                  </div>
                )}
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('标签（1-5 个）')}</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    onBlur={() => {
                      if (tagInput.trim()) addTag(tagInput);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={t('输入标签')}
                    disabled={tags.length >= 5}
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    disabled={tags.length >= 5}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {t('添加')}
                  </button>
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addTag(tag.name)}
                        className="px-2 py-1 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-primary-100 hover:text-primary-700"
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm"
                      >
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('上传附件（可选）')}</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${uploading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer`}>
                  {uploading ? t('上传中...') : t('选择文件')}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => handleFileUpload(event.target.files)}
                  />
                </label>
                <span className="text-xs text-gray-500">{t('支持任意格式，最多 10 个文件，单个 ≤ 100MB')}</span>
              </div>
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2 text-sm">
                  {attachments.map((item) => (
                    <div key={item.url} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-700">{item.name || item.url}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(item.url)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
                className="rounded border-gray-300"
              />
              {t('匿名提问（仅展示匿名）')}
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('取消')}
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? t('提交中...') : (uploading ? t('上传中...') : t('发布提问'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
