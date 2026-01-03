// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { bookingAPI, videoAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const LEGACY_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
  reviewed: '已评价'
};

export default function BookingPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<{
    role: 'all' | 'requester' | 'consultant';
    status: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
  }>({ role: 'all', status: 'all' });
  const [slotForm, setSlotForm] = useState({ date: '', startTime: '', endTime: '', price: 0 });
  const [targetUserId, setTargetUserId] = useState('');
  const [slotsByUser, setSlotsByUser] = useState<any[]>([]);

  const canOperate = useMemo(() => Boolean(user?.id), [user]);

  const load = async () => {
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        bookingAPI.mySlots(),
        bookingAPI.myBookings(),
      ]);
      setMySlots(slotsRes.data);
      setMyBookings(bookingsRes.data);
    } catch (e: any) {
      toast.error(e.message || '加载失败');
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const presetId = searchParams.get('consultantId');
    if (!presetId) return;
    setTargetUserId(presetId);
    queryUserSlots(presetId);
  }, [searchParams]);

  const createSlot = async () => {
    try {
      if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
        toast.error('请填写完整的日期与时间');
        return;
      }
      if (slotForm.endTime <= slotForm.startTime) {
        toast.error('结束时间需晚于开始时间');
        return;
      }
      await bookingAPI.createSlot(slotForm);
      toast.success('已创建时段');
      setSlotForm({ date: '', startTime: '', endTime: '', price: 0 });
      load();
    } catch (e: any) { toast.error(e.message || '创建失败'); }
  };

  const queryUserSlots = async (overrideId?: string) => {
    const lookupId = overrideId || targetUserId;
    if (!lookupId) return;
    try {
      const res = await bookingAPI.slotsByUser(lookupId);
      setSlotsByUser(res.data);
    } catch (e: any) { toast.error(e.message || '查询失败'); }
  };

  const bookSlot = async (slotId: string) => {
    try {
      const { data } = await bookingAPI.createBooking({
        slotId,
        purpose: '咨询',
        duration: 60,
        skill: '咨询'
      });
      await bookingAPI.pay(data.id);
      try {
        await bookingAPI.attachRoom(data.id);
      } catch (err) {
        console.warn('创建会议失败，等待咨询师创建', err);
      }
      toast.success('预约成功');
      load();
    } catch (e: any) { toast.error(e.message || '预约失败'); }
  };

  const startMeeting = async (booking: any) => {
    if (!booking.roomId) {
      toast.error('未绑定会议');
      return;
    }
    await videoAPI.startRoom(booking.roomId);
    window.location.href = `/video/${booking.roomId}`;
  };

  const filteredBookings = myBookings.filter((b) => {
    const matchRole = bookingFilter.role === 'all' || (bookingFilter.role === 'requester' ? b.requesterId === user?.id : b.consultantId === user?.id);
    const matchStatus = bookingFilter.status === 'all' || b.status === bookingFilter.status;
    return matchRole && matchStatus;
  });

  const setStatus = async (b: any, action: 'confirm'|'cancel'|'complete') => {
    try {
      await bookingAPI.updateStatus(b.id, action);
      toast.success('状态已更新');
      load();
    } catch (e: any) { toast.error(e.message || '更新失败'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b pb-2">
        <NavLink to="/booking" className="text-sm font-semibold text-primary-600">
          时段预约
        </NavLink>
        <NavLink to="/booking/services" className="text-sm text-gray-500 hover:text-gray-900">
          服务预约（新流程）
        </NavLink>
      </div>

      <h2 className="text-xl font-semibold">预约管理</h2>

      {/* 我创建的可预约时段 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-3">我提供的可预约时段</h3>
        <div className="grid grid-cols-5 gap-2">
          <input
            className="input"
            type="date"
            value={slotForm.date}
            onChange={e=>setSlotForm({...slotForm, date: e.target.value})}
          />
          <input
            className="input"
            type="time"
            value={slotForm.startTime}
            onChange={e=>setSlotForm({...slotForm, startTime: e.target.value})}
          />
          <input
            className="input"
            type="time"
            value={slotForm.endTime}
            onChange={e=>setSlotForm({...slotForm, endTime: e.target.value})}
          />
          <input className="input" placeholder="价格" type="number" value={slotForm.price} onChange={e=>setSlotForm({...slotForm, price: Number(e.target.value)})} />
          <button className="btn" onClick={createSlot} disabled={!canOperate}>新增时段</button>
        </div>
        <ul className="mt-3 text-sm text-gray-700 space-y-1">
          {mySlots.map(s => (
            <li key={s.id}>{new Date(s.date).toLocaleDateString()} {s.startTime}-{s.endTime} ￥{s.price} {s.isBooked ? '（已被预约）' : ''}</li>
          ))}
        </ul>
      </div>

      {/* 查找他人可预约时段并预约 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-3">预约他人</h3>
        <div className="flex gap-2">
          <input className="input" placeholder="咨询师用户ID" value={targetUserId} onChange={e=>setTargetUserId(e.target.value)} />
          <button className="btn" onClick={queryUserSlots}>查询</button>
        </div>
        <ul className="mt-3 space-y-2">
          {slotsByUser.map(s => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span>{new Date(s.date).toLocaleDateString()} {s.startTime}-{s.endTime} ￥{s.price}</span>
              <button className="btn" onClick={()=>bookSlot(s.id)}>预约</button>
            </li>
          ))}
        </ul>
      </div>

      {/* 我的预约 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-medium mb-3">我的预约</h3>
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <label>角色</label>
          <select className="input" value={bookingFilter.role} onChange={e=>setBookingFilter({...bookingFilter, role: e.target.value as any})}>
            <option value="all">全部</option>
            <option value="requester">我发起的</option>
            <option value="consultant">我被预约的</option>
          </select>
          <label>状态</label>
          <select className="input" value={bookingFilter.status} onChange={e=>setBookingFilter({...bookingFilter, status: e.target.value as any})}>
            <option value="all">全部</option>
            <option value="pending">待处理</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
            <option value="completed">已完成</option>
          </select>
          <button className="btn" onClick={load}>刷新</button>
        </div>
        <ul className="space-y-2 text-sm">
          {filteredBookings.map(b => {
            const iAmRequester = b.requesterId === user?.id;
            const iAmConsultant = b.consultantId === user?.id;
            const statusLabel = LEGACY_STATUS_LABELS[b.status] || b.status;
            return (
              <li key={b.id} className="flex items-center justify-between">
                <span>{statusLabel} · ￥{b.amount} · roomId:{b.roomId || '-'} · {(iAmRequester?'我发起':'我被约')}</span>
                <div className="space-x-2">
                  {b.status==='pending' && iAmConsultant && (
                    <>
                      <button className="btn" onClick={()=>setStatus(b,'confirm')}>同意</button>
                      <button className="btn" onClick={()=>setStatus(b,'cancel')}>拒绝</button>
                    </>
                  )}
                  {b.status==='confirmed' && (
                    <>
                      {b.roomId && <button className="btn" onClick={()=>startMeeting(b)}>进入会议</button>}
                      <button className="btn" onClick={()=>setStatus(b,'cancel')}>取消</button>
                      {iAmConsultant && <button className="btn" onClick={()=>setStatus(b,'complete')}>标记完成</button>}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
