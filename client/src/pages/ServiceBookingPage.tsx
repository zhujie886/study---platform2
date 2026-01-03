// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/services/api_extended';

const READY_WINDOW_MINUTES = 10;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: '待支付',
  paid: '已支付',
  ready: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
  refunding: '退款中',
  dispute: '纠纷中',
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

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-');

const buildTimeline = (booking: any) => {
  const items = [
    { label: '创建订单', time: booking.createdAt },
  ];
  if (booking.payment?.paidAt) items.push({ label: '完成支付', time: booking.payment.paidAt });
  if (booking.startAt) items.push({ label: '预约开始', time: booking.startAt });
  if (booking.startedAt) items.push({ label: '会议开始', time: booking.startedAt });
  if (booking.completedAt) items.push({ label: '会议结束', time: booking.completedAt });
  if (booking.cancelReason) items.push({ label: '订单取消', time: booking.updatedAt });
  if (booking.refundAmount && booking.refundAmount > 0) items.push({ label: `退款 ¥${booking.refundAmount}`, time: booking.updatedAt });
  return items;
};

export default function ServiceBookingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
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
      toast.error(e.message || '加载失败');
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
      toast.error('请选择改期时间');
      return;
    }
    try {
      await orderAPI.rescheduleBooking(b.id, new Date(rescheduleValue).toISOString());
      toast.success('改期已提交');
      setRescheduleTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '改期失败');
    }
  };

  const cancelBooking = async (b: any) => {
    const reason = window.prompt('取消原因（可选）', '') || undefined;
    try {
      await orderAPI.cancelBooking(b.id, reason);
      toast.success('订单已取消');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '取消失败');
    }
  };

  const startMeeting = async (b: any) => {
    try {
      await orderAPI.startMeeting(b.id);
      toast.success('会议已开始');
      navigate(`/video/${b.roomId}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '开始会议失败');
    }
  };

  const endMeeting = async (b: any) => {
    try {
      await orderAPI.endMeeting(b.id);
      toast.success('会议已结束');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '结束会议失败');
    }
  };

  const joinMeeting = (b: any) => {
    if (!b.roomId) {
      toast.error('未创建会议');
      return;
    }
    navigate(`/video/${b.roomId}`);
  };

  const viewService = (b: any) => {
    if (!b.serviceId) {
      toast.error('服务信息不可用');
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
      toast.success('批量取消完成');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '批量取消失败');
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
      toast.success('批量开始完成');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '批量开始失败');
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
      toast.success('批量结束完成');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '批量结束失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-2">
        <NavLink to="/booking" className="text-sm text-gray-500 hover:text-gray-900">
          时段预约
        </NavLink>
        <NavLink to="/booking/services" className="text-sm font-semibold text-primary-600">
          服务预约（新流程）
        </NavLink>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label>角色</label>
          <select className="input" value={filter.role} onChange={e=>setFilter({...filter, role: e.target.value as any})}>
            <option value="all">全部</option>
            <option value="requester">我发起的</option>
            <option value="consultant">我被预约的</option>
          </select>
          <label>状态</label>
          <select className="input" value={filter.status} onChange={e=>setFilter({...filter, status: e.target.value as any})}>
            <option value="all">全部</option>
            <option value="pending_payment">待支付</option>
            <option value="paid">已支付</option>
            <option value="ready">待开始</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="refunded">已退款</option>
          </select>
          <button className="btn" onClick={load}>刷新</button>
          <button className="btn" onClick={toggleSelectAll}>
            {selectedIds.length === filtered.length ? '取消全选' : '全选'}
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
            <span>已选 {selectedIds.length} 项</span>
            <button className="btn" onClick={batchCancel} disabled={!canBatchCancel}>批量取消</button>
            <button className="btn" onClick={batchStart} disabled={!canBatchStart}>批量开始</button>
            <button className="btn" onClick={batchEnd} disabled={!canBatchEnd}>批量结束</button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm text-center text-gray-500">
          <div className="text-4xl mb-3">空</div>
          <p>暂无服务预约记录</p>
          <button className="btn mt-4" onClick={() => navigate('/community')}>去看看问答与咨询</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((b) => {
            const displayStatus = deriveDisplayStatus(b);
            const badgeClass = STATUS_BADGE[displayStatus] || 'bg-gray-100 text-gray-600';
            const statusLabel = STATUS_LABELS[displayStatus] || displayStatus;
            const timeLabel = b.startAt ? new Date(b.startAt).toLocaleString('zh-CN') : '-';
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
                      <div className="text-base font-semibold">{b.service?.title || b.skill || '服务'}</div>
                      <div className="text-xs text-gray-500">{timeLabel}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badgeClass}`}>
                      {statusLabel}
                    </span>
                    <div className="text-sm font-semibold mt-2">￥{b.amount}</div>
                    {typeof b.refundAmount === 'number' && b.refundAmount > 0 && (
                      <div className="text-xs text-teal-600">已退款 ¥{b.refundAmount}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-gray-100">{isRequester ? '我发起' : '我被约'}</span>
                  {b.roomId && <span className="px-2 py-1 rounded-full bg-gray-100">会议已创建</span>}
                  {b.rescheduleCount > 0 && (
                    <span className="px-2 py-1 rounded-full bg-gray-100">已改期 {b.rescheduleCount} 次</span>
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
                    <button className="btn" onClick={() => submitReschedule(b)}>确认改期</button>
                    <button className="btn" onClick={() => setRescheduleTarget(null)}>取消</button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => setActiveBooking(b)}>详情</button>
                  <button className="btn" onClick={() => viewService(b)}>查看详情</button>
                  {b.roomId && (
                    <button className="btn" onClick={() => joinMeeting(b)} disabled={!canJoin}>
                      进入会议
                    </button>
                  )}
                  {isConsultant && b.roomId && ['ready', 'paid'].includes(displayStatus) && (
                    <button className="btn" onClick={() => startMeeting(b)}>开始会议</button>
                  )}
                  {isConsultant && ['in_progress'].includes(displayStatus) && (
                    <button className="btn" onClick={() => endMeeting(b)}>结束会议</button>
                  )}
                  {canOperate && (
                    <>
                      <button className="btn" onClick={() => openReschedule(b)}>改期</button>
                      <button className="btn" onClick={() => cancelBooking(b)}>取消/退款</button>
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
                <div className="text-lg font-semibold">订单详情</div>
                <div className="text-xs text-gray-500">订单号：{activeBooking.id}</div>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setActiveBooking(null)}>
                关闭
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">服务</div>
                  <div className="font-medium">{activeBooking.service?.title || activeBooking.skill}</div>
                </div>
                <div>
                  <div className="text-gray-500">预约时间</div>
                  <div className="font-medium">{formatTime(activeBooking.startAt)}</div>
                </div>
                <div>
                  <div className="text-gray-500">时长</div>
                  <div className="font-medium">{activeBooking.service?.durationMinutes ?? activeBooking.duration} 分钟</div>
                </div>
                <div>
                  <div className="text-gray-500">金额</div>
                  <div className="font-medium">￥{activeBooking.amount}</div>
                </div>
                <div>
                  <div className="text-gray-500">问题描述</div>
                  <div className="font-medium">{activeBooking.questionText || activeBooking.purpose || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500">会议房间</div>
                  <div className="font-medium">{activeBooking.roomId || '-'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-3">时间轴</div>
                <div className="space-y-3">
                  {buildTimeline(activeBooking).map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex gap-3 items-start">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary-500"></div>
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{formatTime(item.time)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeBooking.cancelReason && (
                <div className="text-sm text-rose-600">取消原因：{activeBooking.cancelReason}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

