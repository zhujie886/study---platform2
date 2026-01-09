import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { qaAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import AvailableSlotsPanel from '@/components/AvailableSlotsPanel';

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

type Answer = {
  id: string;
  questionId: string;
  content: string;
  contentFormat: string;
  isAnonymous: boolean;
  status: string;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  user: User | null;
  attachments: Attachment[];
  isAccepted?: boolean;
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
  resolvedAt?: string | null;
  user: User | null;
  category: Category;
  tags: Tag[];
  attachments: Attachment[];
  answers?: Answer[];
  canAccept?: boolean;
  canEdit?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  open: '未解决',
  resolved: '已解决',
  closed: '已关闭'
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api')
  ? String(API_BASE)
  : `${String(API_BASE).replace(/\/$/, '')}/api`;
const FILE_BASE = String(API_BASE).endsWith('/api')
  ? String(API_BASE).slice(0, -4)
  : String(API_BASE).replace(/\/$/, '');

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN');
}

function getDisplayName(user: User | null, isAnonymous?: boolean) {
  if (isAnonymous || user?.isAnonymous) return '匿名用户';
  return user?.username || '匿名用户';
}

function resolveFileUrl(value?: string | null) {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${FILE_BASE}${normalized}`;
}

type AttachmentInput = {
  url: string;
  name?: string | null;
  size?: number | null;
  mimeType?: string | null;
  type?: string;
};

export default function QuestionDetailPage() {
  const { id } = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [answerAnonymous, setAnswerAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const { token } = useAuthStore();

  const fetchQuestion = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await qaAPI.getQuestion(id);
      setQuestion(response.data);
    } catch (error) {
      console.error('加载问题失败', error);
      toast.error('加载问题失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((item) => item.url !== url));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!token) {
      toast.error('请先登录后上传附件');
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
        toast.error('附件上传失败');
        return;
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error('附件上传失败', error);
      toast.error('附件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleAnswerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    const trimmed = answerContent.trim();
    if (trimmed.length < 20) {
      toast.error('回答至少 20 字');
      return;
    }
    if (uploading) {
      toast.error('请等待附件上传完成');
      return;
    }

    try {
      setSubmitting(true);
      await qaAPI.createAnswer(id, {
        content: trimmed,
        contentFormat: 'markdown',
        isAnonymous: answerAnonymous,
        attachments
      });
      toast.success('回答已提交');
      setAnswerContent('');
      setAnswerAnonymous(false);
      setAttachments([]);
      await fetchQuestion();
    } catch (error) {
      console.error('提交回答失败', error);
      toast.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptToggle = async (answer: Answer) => {
    if (!question) return;
    try {
      setAcceptingId(answer.id);
      if (answer.isAccepted) {
        await qaAPI.revokeAccept(question.id);
        toast.success('已取消采纳');
      } else {
        await qaAPI.acceptAnswer(question.id, answer.id);
        toast.success('已采纳答案');
      }
      await fetchQuestion();
    } catch (error) {
      console.error('采纳操作失败', error);
      toast.error('操作失败');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleResolve = async () => {
    if (!question) return;
    try {
      setStatusUpdating(true);
      await qaAPI.resolveQuestion(question.id);
      toast.success('已标记为已解决');
      await fetchQuestion();
    } catch (error) {
      console.error('标记已解决失败', error);
      toast.error('操作失败');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleReopen = async () => {
    if (!question) return;
    try {
      setStatusUpdating(true);
      await qaAPI.reopenQuestion(question.id);
      toast.success('已撤回已解决状态');
      await fetchQuestion();
    } catch (error) {
      console.error('撤回已解决失败', error);
      toast.error('操作失败');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">没有找到这个问题</p>
          <Link to="/community" className="relative z-20 inline-flex items-center gap-2 btn-soft px-3 py-1.5 rounded-full text-sm">
            <ArrowLeftIcon className="w-4 h-4" />
            返回提问广场
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/community" className="relative z-20 inline-flex items-center gap-2 btn-soft px-3 py-1.5 rounded-full text-sm">
          <ArrowLeftIcon className="w-4 h-4" />
          返回提问广场
        </Link>

        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${question.status === 'resolved' ? 'bg-green-100 text-green-700' : question.status === 'closed' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
              {STATUS_LABELS[question.status] || '未解决'}
            </span>
            <span className="text-sm text-gray-500">{question.category?.name || '未分类'}</span>
            <span className="text-xs text-gray-400">{formatDate(question.createdAt)}</span>
          </div>

          {question.canEdit && (
            <div className="mt-3 flex flex-wrap gap-2">
              {question.status === 'resolved' ? (
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={statusUpdating}
                  className="px-3 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  撤回已解决
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={statusUpdating}
                  className="px-3 py-1 text-xs rounded-full border border-green-200 text-green-700 hover:text-green-800 disabled:opacity-50"
                >
                  标记已解决
                </button>
              )}
            </div>
          )}

          <h1 className="mt-3 text-2xl font-bold text-gray-900">{question.title}</h1>
          <p className="mt-4 text-gray-700 whitespace-pre-wrap leading-relaxed">{question.content}</p>

          {question.attachments?.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-gray-700">附件</div>
              <div className="mt-2 space-y-2">
                {question.attachments.map((item) => (
                  <a
                    key={item.id || item.url}
                    href={resolveFileUrl(item.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm text-primary-600 hover:text-primary-800"
                  >
                    {item.name || item.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {question.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <span key={tag.id} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>回答 {question.answerCount}</span>
              <span>浏览 {question.viewCount}</span>
            </div>
            <span>{getDisplayName(question.user, question.isAnonymous)}</span>
          </div>
        </div>

        <AvailableSlotsPanel
          userId={question.isAnonymous ? null : question.user?.id}
          title="提问者可预约时间"
        />

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">回答问题</h2>
          <form onSubmit={handleAnswerSubmit} className="mt-4 space-y-4">
            <textarea
              value={answerContent}
              onChange={(event) => setAnswerContent(event.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              rows={6}
              placeholder="写下你的回答（支持 Markdown）"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">上传附件（可选）</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${uploading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer`}>
                  {uploading ? '上传中...' : '选择文件'}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => handleFileUpload(event.target.files)}
                  />
                </label>
                <span className="text-xs text-gray-500">支持任意格式，最多 10 个文件，单个 ≤ 100MB</span>
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
                checked={answerAnonymous}
                onChange={(event) => setAnswerAnonymous(event.target.checked)}
                className="rounded border-gray-300"
              />
              匿名回答
            </label>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? '提交中...' : (uploading ? '上传中...' : '提交回答')}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">全部回答</h2>
            <span className="text-sm text-gray-500">{question.answers?.length || 0} 条</span>
          </div>

          {question.answers && question.answers.length > 0 ? (
            question.answers.map((answer) => (
              <div
                key={answer.id}
                className={`rounded-2xl border p-5 ${answer.isAccepted ? 'border-green-200 bg-green-50/60' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {answer.isAccepted && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                    <span className="font-medium text-gray-900">
                      {getDisplayName(answer.user, answer.isAnonymous)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(answer.createdAt)}</span>
                  </div>
                  {question.canAccept && (
                    <button
                      type="button"
                      onClick={() => handleAcceptToggle(answer)}
                      disabled={acceptingId === answer.id}
                      className={`text-sm px-3 py-1 rounded-full border ${answer.isAccepted ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-600 hover:text-primary-600'}`}
                    >
                      {answer.isAccepted ? '取消采纳' : '采纳'}
                    </button>
                  )}
                </div>

                <p className="mt-3 text-gray-700 whitespace-pre-wrap leading-relaxed">{answer.content}</p>

                {answer.attachments?.length > 0 && (
                  <div className="mt-3 space-y-2 text-sm">
                    {answer.attachments.map((item) => (
                      <a
                        key={item.id || item.url}
                        href={resolveFileUrl(item.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-primary-600 hover:text-primary-800"
                      >
                        {item.name || item.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-gray-500">
              暂无回答，来成为第一个回答的人吧
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




