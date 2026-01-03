// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { consultantAPI, orderAPI } from '@/services/api_extended';

export default function BookingCheckoutPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState<any>(null);
  const [step, setStep] = useState<'confirm' | 'pay' | 'success'>('confirm');
  const [booking, setBooking] = useState<any>(null);
  const [startAt, setStartAt] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      toast.error('无效的服务ID');
      navigate(-1);
      return;
    }

    const fetchService = async () => {
      try {
        const response = await consultantAPI.getServiceById(serviceId);
        setService(response.data);
      } catch (error) {
        toast.error('加载服务信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate]);

  const priceLabel = useMemo(() => {
    if (!service) return '';
    if (!service.currency || service.currency === 'CNY') return `￥${service.price}`;
    return `${service.price} ${service.currency}`;
  }, [service]);

  const handleCreateOrder = async () => {
    if (!startAt) {
      toast.error('请选择预约时间');
      return;
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      toast.error('预约时间格式不正确');
      return;
    }

    try {
      const res = await orderAPI.createBooking({
        serviceId,
        startAt: startDate.toISOString(),
        questionText
      });

      setBooking(res.data);
      setStep('pay');
      toast.success('订单创建成功');
    } catch (e) {
      toast.error('创建订单失败');
    }
  };

  const handlePay = async () => {
    if (!booking) return;
    try {
      await orderAPI.payBooking(booking.id);
      setStep('success');
      toast.success('支付成功！');
    } catch (e) {
      toast.error('支付失败');
    }
  };

  if (loading) {
    return <div className="text-center py-20">正在加载服务信息...</div>;
  }

  if (!service) {
    return <div className="text-center py-20">服务不存在或已下架</div>;
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">预约成功！</h2>
          <p className="text-gray-600 mb-6">订单已完成支付，会议将按时间开始。</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/booking')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              查看预约
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">预约确认</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 space-y-2">
        <h3 className="text-xl font-semibold">{service.title}</h3>
        {service.description && <p className="text-gray-500">{service.description}</p>}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
          <span>{service.durationMinutes} 分钟</span>
          <span className="text-primary-600 font-semibold">{priceLabel}</span>
        </div>
      </div>

      {step === 'confirm' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择预约时间</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg p-3"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <textarea
            className="w-full border rounded-lg p-3"
            placeholder="给咨询师留言或说明问题..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
          />
          <button
            onClick={handleCreateOrder}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition"
          >
            确认并创建订单
          </button>
        </div>
      )}

      {step === 'pay' && (
        <div className="text-center">
          <p className="mb-6 text-gray-600">请完成支付以确认预约</p>
          <button
            onClick={handlePay}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="w-5 h-5" /> 立即支付
          </button>
        </div>
      )}
    </div>
  );
}
