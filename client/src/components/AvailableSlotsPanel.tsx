import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  price?: number | null;
};

type Props = {
  userId?: string | null;
  title?: string;
};

export default function AvailableSlotsPanel({ userId, title = '可预约时间' }: Props) {
  const { user } = useAuthStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwn = Boolean(userId && user?.id === userId);

  useEffect(() => {
    if (!userId) return;
    const loadSlots = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await bookingAPI.slotsByUser(userId);
        setSlots(response.data || []);
      } catch (err: any) {
        console.error('加载可预约时间失败', err);
        setError('加载可预约时间失败');
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">可预约的空闲时段</p>
        </div>
        {isOwn ? (
          <Link to="/booking" className="text-sm text-primary-600 hover:text-primary-700">
            管理时段
          </Link>
        ) : (
          <Link
            to={`/booking?consultantId=${userId}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            去预约
          </Link>
        )}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">加载中...</div>
      ) : error ? (
        <div className="mt-4 text-sm text-rose-500">{error}</div>
      ) : slots.length === 0 ? (
        <div className="mt-4 text-sm text-gray-500">暂无可预约时间</div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            >
              <div className="font-medium text-gray-900">
                {new Date(slot.date).toLocaleDateString('zh-CN')} {slot.startTime}-{slot.endTime}
              </div>
              <div className="text-xs text-gray-500 mt-1">￥{slot.price ?? 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
