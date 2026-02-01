import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { qaAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import AvailableSlotsPanel from '@/components/AvailableSlotsPanel';
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

const STATUS_LABEL_KEYS: Record<string, string> = {
  open: 'question.status.open',
  resolved: 'question.status.resolved',
  closed: 'question.status.closed'
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api')
  ? String(API_BASE)
  : `${String(API_BASE).replace(/\/$/, '')}/api`;
const FILE_BASE = String(API_BASE).endsWith('/api')
  ? String(API_BASE).slice(0, -4)
  : String(API_BASE).replace(/\/$/, '');

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale);
}

function getDisplayName(
  user: User | null,
  isAnonymous: boolean | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (isAnonymous || user?.isAnonymous) return t('question.anonymous_user');
  return user?.username || t('question.anonymous_user');
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
  const { t, lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';

  const fetchQuestion = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await qaAPI.getQuestion(id);
      setQuestion(response.data);
    } catch (error) {
      console.error(t('question.load_failed'), error);
      toast.error(t('question.load_failed'));
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
      toast.error(t('question.upload_login_required'));
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
        toast.error(t('question.upload_failed'));
        return;
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error(t('question.upload_failed'), error);
      toast.error(t('question.upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleAnswerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    const trimmed = answerContent.trim();
    if (trimmed.length < 20) {
      toast.error(t('question.answer_too_short'));
      return;
    }
    if (uploading) {
      toast.error(t('question.wait_upload'));
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
      toast.success(t('question.answer_submitted'));
      setAnswerContent('');
      setAnswerAnonymous(false);
      setAttachments([]);
      await fetchQuestion();
    } catch (error) {
      console.error(t('question.submit_failed'), error);
      toast.error(t('question.submit_failed'));
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
        toast.success(t('question.accept_revoked'));
      } else {
        await qaAPI.acceptAnswer(question.id, answer.id);
        toast.success(t('question.answer_accepted'));
      }
      await fetchQuestion();
    } catch (error) {
      console.error(t('question.action_failed'), error);
      toast.error(t('question.action_failed'));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleResolve = async () => {
    if (!question) return;
    try {
      setStatusUpdating(true);
      await qaAPI.resolveQuestion(question.id);
      toast.success(t('question.resolved_marked'));
      await fetchQuestion();
    } catch (error) {
      console.error(t('question.resolve_failed'), error);
      toast.error(t('question.action_failed'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleReopen = async () => {
    if (!question) return;
    try {
      setStatusUpdating(true);
      await qaAPI.reopenQuestion(question.id);
      toast.success(t('question.reopened'));
      await fetchQuestion();
    } catch (error) {
      console.error(t('question.reopen_failed'), error);
      toast.error(t('question.action_failed'));
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <p className="mt-4 text-gray-500">{t('question.loading')}</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">{t('question.not_found')}</p>
          <Link to="/community" className="relative z-20 inline-flex items-center gap-2 btn-soft px-3 py-1.5 rounded-full text-sm">
            <ArrowLeftIcon className="w-4 h-4" />
            {t('question.back_to_plaza')}
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
          {t('question.back_to_plaza')}
        </Link>

        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${question.status === 'resolved' ? 'bg-green-100 text-green-700' : question.status === 'closed' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
              {t(STATUS_LABEL_KEYS[question.status] || 'question.status.open')}
            </span>
            <span className="text-sm text-gray-500">{question.category?.name || t('question.uncategorized')}</span>
            <span className="text-xs text-gray-400">{formatDate(question.createdAt, locale)}</span>
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
                  {t('question.reopen')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={statusUpdating}
                  className="px-3 py-1 text-xs rounded-full border border-green-200 text-green-700 hover:text-green-800 disabled:opacity-50"
                >
                  {t('question.resolve')}
                </button>
              )}
            </div>
          )}

          <h1 className="mt-3 text-2xl font-bold text-gray-900">{question.title}</h1>
          <p className="mt-4 text-gray-700 whitespace-pre-wrap leading-relaxed">{question.content}</p>

          {question.attachments?.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-gray-700">{t('question.attachments')}</div>
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
              <span>{t('question.answer_count', { count: question.answerCount })}</span>
              <span>{t('question.view_count', { count: question.viewCount })}</span>
            </div>
            <span>{getDisplayName(question.user, question.isAnonymous, t)}</span>
          </div>
        </div>

        <AvailableSlotsPanel
          userId={question.isAnonymous ? null : question.user?.id}
          title={t('question.slots_title')}
        />

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('question.answer_title')}</h2>
          <form onSubmit={handleAnswerSubmit} className="mt-4 space-y-4">
            <textarea
              value={answerContent}
              onChange={(event) => setAnswerContent(event.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              rows={6}
              placeholder={t('question.answer_placeholder')}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('question.upload_label')}</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${uploading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'} cursor-pointer`}>
                  {uploading ? t('question.uploading') : t('question.choose_file')}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => handleFileUpload(event.target.files)}
                  />
                </label>
                <span className="text-xs text-gray-500">{t('question.upload_hint')}</span>
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
              {t('question.anonymous_answer')}
            </label>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? t('question.submitting') : (uploading ? t('question.uploading') : t('question.submit_answer'))}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('question.answers_title')}</h2>
            <span className="text-sm text-gray-500">{t('question.count_label', { count: question.answers?.length || 0 })}</span>
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
                      {getDisplayName(answer.user, answer.isAnonymous, t)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(answer.createdAt, locale)}</span>
                  </div>
                  {question.canAccept && (
                    <button
                      type="button"
                      onClick={() => handleAcceptToggle(answer)}
                      disabled={acceptingId === answer.id}
                      className={`text-sm px-3 py-1 rounded-full border ${answer.isAccepted ? 'border-green-300 text-green-700' : 'border-gray-300 text-gray-600 hover:text-primary-600'}`}
                    >
                      {answer.isAccepted ? t('question.unaccept') : t('question.accept')}
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
              {t('question.no_answers')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




