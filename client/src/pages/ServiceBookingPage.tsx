// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/services/api_extended';
import { useLanguage } from '@/i18n/LanguageContext';

const READY_WINDOW_MINUTES = 10;

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending_payment: 'booking.services.status.pending_payment',
  paid: 'booking.services.status.paid',
  ready: 'booking.services.status.ready',
  in_progress: 'booking.services.status.in_progress',
  completed: 'booking.services.status.completed',
  cancelled: 'booking.services.status.cancelled',
  refunded: 'booking.services.status.refunded',
  refunding: 'booking.services.status.refunding',
  dispute: 'booking.services.status.dispute',
};

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  ready: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-rose-100 text-rose-700',
  refunded: 'bg-teal-100 text-teal-700',
  refunding: 'bg-teal-100 text-teal-700',
  dispute: 'bg-orange-100 text-orange-700',
};

const toLocalInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const computeEndAt = (booking: any) => {
  if (booking.endAt) return new Date(booking.endAt);
  const start = booking.startAt ? new Date(booking.startAt) : null;
  if (!start) return null;
  const duration = booking.service?.durationMinutes ?? booking.duration ?? 0;
  if (!duration) return null;
  return new Date(start.getTime() + duration * 60000);
};

const deriveDisplayStatus = (booking: any) => {
  const rawStatus = booking.status;
  if (rawStatus !== 'paid') return rawStatus;

  const now = new Date();
  const start = booking.startAt ? new Date(booking.startAt) : null;
  const end = computeEndAt(booking);
  if (end && now >= end) return 'completed';
  if (start && now >= start) return 'in_progress';
  if (start) {
    const readyAt = new Date(start.getTime() - READY_WINDOW_MINUTES * 60000);
    if (now >= readyAt) return 'ready';
  }
  return 'paid';
};

const formatTime = (value?: string, locale = 'zh-CN') =>
  value ? new Date(value).toLocaleString(locale) : '-';

const buildTimeline = (booking: any, t: (key: string, vars?: Record<string, string | number>) => string) => {
  const items = [
    { label: t('booking.services.timeline.created'), time: booking.createdAt },
  ];
  if (booking.payment?.paidAt) items.push({ label: t('booking.services.timeline.paid'), time: booking.payment.paidAt });
  if (booking.startAt) items.push({ label: t('booking.services.timeline.start'), time: booking.startAt });
  if (booking.startedAt) items.push({ label: t('booking.services.timeline.meeting_start'), time: booking.startedAt });
  if (booking.completedAt) items.push({ label: t('booking.services.timeline.meeting_end'), time: booking.completedAt });
  if (booking.cancelReason) items.push({ label: t('booking.services.timeline.cancelled'), time: booking.updatedAt });
  if (booking.refundAmount && booking.refundAmount > 0) {
    items.push({
      label: t('booking.services.timeline.refund_amount', { amount: booking.refundAmount }),
      time: booking.updatedAt
    });
  }
  return items;
};

export default function ServiceBookingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const locale = lang === 'en' ? 'en-US' : 'zh-CN';
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<{
    role: 'all' | 'requester' | 'consultant';
    status: 'all' | 'pending_payment' | 'paid' | 'ready' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  }>({ role: 'all', status: 'all' });
  const [rescheduleTarget, setRescheduleTarget] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await orderAPI.getMyBookings();
      setBookings(res.data);
      setSelectedIds([]);
    } catch (e: any) {
      toast.error(e.message || t('booking.services.load_failed'));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const roleMatch =
        filter.role === 'all' ||
        (filter.role === 'requester' ? b.requesterId === user?.id : b.consultantId === user?.id);
      const displayStatus = deriveDisplayStatus(b);
      const statusMatch = filter.status === 'all' || displayStatus === filter.status;
      return roleMatch && statusMatch;
    });
  }, [bookings, filter, user]);

  const selectedBookings = useMemo(
    () => filtered.filter((b) => selectedIds.includes(b.id)),
    [filtered, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (filtered.length === 0) return;
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((b) => b.id));
    }
  };

  const openReschedule = (b: any) => {
    setRescheduleTarget(b.id);
    setRescheduleValue(toLocalInput(b.startAt));
  };

  const submitReschedule = async (b: any) => {
    if (!rescheduleValue) {
      toast.error(t('booking.services.reschedule.pick_time'));
      return;
    }
    try {
      await orderAPI.rescheduleBooking(b.id, new Date(rescheduleValue).toISOString());
      toast.success(t('booking.services.reschedule.submitted'));
      setRescheduleTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.reschedule.failed'));
    }
  };

  const cancelBooking = async (b: any) => {
    const reason = window.prompt(t('booking.services.cancel.prompt_reason'), '') || undefined;
    try {
      await orderAPI.cancelBooking(b.id, reason);
      toast.success(t('booking.services.cancel.success'));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.cancel.failed'));
    }
  };

  const startMeeting = async (b: any) => {
    try {
      await orderAPI.startMeeting(b.id);
      toast.success(t('booking.services.meeting.started'));
      navigate(`/video/${b.roomId}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.meeting.start_failed'));
    }
  };

  const endMeeting = async (b: any) => {
    try {
      await orderAPI.endMeeting(b.id);
      toast.success(t('booking.services.meeting.ended'));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.meeting.end_failed'));
    }
  };

  const joinMeeting = (b: any) => {
    if (!b.roomId) {
      toast.error(t('booking.services.meeting.no_room'));
      return;
    }
    navigate(`/video/${b.roomId}`);
  };

  const viewService = (b: any) => {
    if (!b.serviceId) {
      toast.error(t('booking.services.service.unavailable'));
      return;
    }
    navigate(`/service/${b.serviceId}`);
  };

  const canBatchCancel = selectedBookings.some((b) => {
    const displayStatus = deriveDisplayStatus(b);
    return ['pending_payment', 'paid'].includes(b.status) && !['in_progress', 'completed'].includes(displayStatus);
  });
  const canBatchStart = selectedBookings.some(
    (b) => b.consultantId === user?.id && b.roomId && ['ready', 'paid'].includes(deriveDisplayStatus(b))
  );
  const canBatchEnd = selectedBookings.some(
    (b) => b.consultantId === user?.id && ['in_progress'].includes(deriveDisplayStatus(b))
  );

  const batchCancel = async () => {
    if (!canBatchCancel) return;
    try {
      for (const booking of selectedBookings) {
        if (['pending_payment', 'paid'].includes(booking.status)) {
          await orderAPI.cancelBooking(booking.id);
        }
      }
      toast.success(t('booking.services.batch.cancel.success'));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.batch.cancel.failed'));
    }
  };

  const batchStart = async () => {
    if (!canBatchStart) return;
    try {
      for (const booking of selectedBookings) {
        const displayStatus = deriveDisplayStatus(booking);
        if (booking.consultantId === user?.id && booking.roomId && ['ready', 'paid'].includes(displayStatus)) {
          await orderAPI.startMeeting(booking.id);
        }
      }
      toast.success(t('booking.services.batch.start.success'));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.batch.start.failed'));
    }
  };

  const batchEnd = async () => {
    if (!canBatchEnd) return;
    try {
      for (const booking of selectedBookings) {
        const displayStatus = deriveDisplayStatus(booking);
        if (booking.consultantId === user?.id && displayStatus === 'in_progress') {
          await orderAPI.endMeeting(booking.id);
        }
      }
      toast.success(t('booking.services.batch.end.success'));
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || t('booking.services.batch.end.failed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-2">
        <NavLink to="/booking" className="text-sm text-gray-500 hover:text-gray-900">
          {t('booking.services.nav.slot_booking')}
        </NavLink>
        <NavLink to="/booking/services" className="text-sm font-semibold text-primary-600">
          {t('booking.services.nav.service_booking')}
        </NavLink>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label>{t('booking.services.filters.role')}</label>
          <select className="input" value={filter.role} onChange={e=>setFilter({...filter, role: e.target.value as any})}>
            <option value="all">{t('booking.services.filters.all')}</option>
            <option value="requester">{t('booking.services.filters.requester')}</option>
            <option value="consultant">{t('booking.services.filters.consultant')}</option>
          </select>
          <label>{t('booking.services.filters.status')}</label>
          <select className="input" value={filter.status} onChange={e=>setFilter({...filter, status: e.target.value as any})}>
            <option value="all">{t('booking.services.filters.all')}</option>
            <option value="pending_payment">{t('booking.services.status.pending_payment')}</option>
            <option value="paid">{t('booking.services.status.paid')}</option>
            <option value="ready">{t('booking.services.status.ready')}</option>
            <option value="in_progress">{t('booking.services.status.in_progress')}</option>
            <option value="completed">{t('booking.services.status.completed')}</option>
            <option value="cancelled">{t('booking.services.status.cancelled')}</option>
            <option value="refunded">{t('booking.services.status.refunded')}</option>
          </select>
          <button className="btn" onClick={load}>{t('booking.services.filters.refresh')}</button>
          <button className="btn" onClick={toggleSelectAll}>
            {selectedIds.length === filtered.length ? t('booking.services.filters.unselect_all') : t('booking.services.filters.select_all')}
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
            <span>{t('booking.services.selected_count', { count: selectedIds.length })}</span>
            <button className="btn" onClick={batchCancel} disabled={!canBatchCancel}>{t('booking.services.batch.cancel.action')}</button>
            <button className="btn" onClick={batchStart} disabled={!canBatchStart}>{t('booking.services.batch.start.action')}</button>
            <button className="btn" onClick={batchEnd} disabled={!canBatchEnd}>{t('booking.services.batch.end.action')}</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm text-center text-gray-500">
          <div className="text-4xl mb-3">{t('booking.services.empty.title')}</div>
          <p>{t('booking.services.empty.description')}</p>
          <button className="btn mt-4" onClick={() => navigate('/community')}>
            {t('booking.services.empty.cta')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const displayStatus = deriveDisplayStatus(b);
            const badgeClass = STATUS_BADGE[displayStatus] || 'bg-gray-100 text-gray-600';
            const statusLabel = t(STATUS_LABEL_KEYS[displayStatus] || displayStatus);
            const timeLabel = b.startAt ? new Date(b.startAt).toLocaleString(locale) : '-';
            const isRequester = b.requesterId === user?.id;
            const canOperate = ['pending_payment', 'paid'].includes(b.status) && !['in_progress', 'completed'].includes(displayStatus);
            const canJoin = ['ready', 'in_progress'].includes(displayStatus);
            const isConsultant = b.consultantId === user?.id;

            return (
              <div key={b.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} />
                    <div>
                      <div className="text-base font-semibold">{b.service?.title || b.skill || t('booking.services.labels.service')}</div>
                      <div className="text-xs text-gray-500">{timeLabel}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badgeClass}`}>
                      {statusLabel}
                    </span>
                    <div className="text-sm font-semibold mt-2">￥{b.amount}</div>
                    {typeof b.refundAmount === 'number' && b.refundAmount > 0 && (
                      <div className="text-xs text-teal-600">
                        {t('booking.services.refund.amount_label', { amount: b.refundAmount })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    {isRequester ? t('booking.services.role.requester') : t('booking.services.role.consultant')}
                  </span>
                  {b.roomId && <span className="px-2 py-1 rounded-full bg-gray-100">{t('booking.services.meeting.created')}</span>}
                  {b.rescheduleCount > 0 && (
                    <span className="px-2 py-1 rounded-full bg-gray-100">
                      {t('booking.services.reschedule.count', { count: b.rescheduleCount })}
                    </span>
                  )}
                </div>

                {rescheduleTarget === b.id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      className="input"
                      value={rescheduleValue}
                      onChange={(e) => setRescheduleValue(e.target.value)}
                    />
                    <button className="btn" onClick={() => submitReschedule(b)}>{t('booking.services.reschedule.confirm')}</button>
                    <button className="btn" onClick={() => setRescheduleTarget(null)}>{t('booking.services.cancel.action')}</button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => setActiveBooking(b)}>{t('booking.services.actions.detail')}</button>
                  <button className="btn" onClick={() => viewService(b)}>{t('booking.services.actions.view_service')}</button>
                  {b.roomId && (
                    <button className="btn" onClick={() => joinMeeting(b)} disabled={!canJoin}>
                      {t('booking.services.actions.join_meeting')}
                    </button>
                  )}
                  {isConsultant && b.roomId && ['ready', 'paid'].includes(displayStatus) && (
                    <button className="btn" onClick={() => startMeeting(b)}>{t('booking.services.actions.start_meeting')}</button>
                  )}
                  {isConsultant && ['in_progress'].includes(displayStatus) && (
                    <button className="btn" onClick={() => endMeeting(b)}>{t('booking.services.actions.end_meeting')}</button>
                  )}
                  {canOperate && (
                    <>
                      <button className="btn" onClick={() => openReschedule(b)}>{t('booking.services.actions.reschedule')}</button>
                      <button className="btn" onClick={() => cancelBooking(b)}>{t('booking.services.actions.cancel_refund')}</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <div className="text-lg font-semibold">{t('booking.services.modal.title')}</div>
                <div className="text-xs text-gray-500">{t('booking.services.modal.order_id', { id: activeBooking.id })}</div>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setActiveBooking(null)}>
                {t('booking.services.modal.close')}
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">{t('booking.services.modal.service')}</div>
                  <div className="font-medium">{activeBooking.service?.title || activeBooking.skill}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('booking.services.modal.start_at')}</div>
                  <div className="font-medium">{formatTime(activeBooking.startAt, locale)}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('booking.services.modal.duration')}</div>
                  <div className="font-medium">
                    {activeBooking.service?.durationMinutes ?? activeBooking.duration} {t('booking.services.modal.minutes')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">{t('booking.services.modal.amount')}</div>
                  <div className="font-medium">￥{activeBooking.amount}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('booking.services.modal.question')}</div>
                  <div className="font-medium">{activeBooking.questionText || activeBooking.purpose || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('booking.services.modal.room')}</div>
                  <div className="font-medium">{activeBooking.roomId || '-'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-3">{t('booking.services.modal.timeline')}</div>
                <div className="space-y-3">
                  {buildTimeline(activeBooking, t).map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex gap-3 items-start">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary-500"></div>
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{formatTime(item.time, locale)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeBooking.cancelReason && (
                <div className="text-sm text-rose-600">
                  {t('booking.services.cancel.reason_label', { reason: activeBooking.cancelReason })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

