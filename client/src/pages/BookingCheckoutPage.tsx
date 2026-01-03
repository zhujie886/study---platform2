// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultantAPI, bookingAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function BookingCheckoutPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      toast.error('无效的服务ID');
      navigate(-1);
      return;
    }

    const fetchService = async () => {
      try {
        // 假设有一个获取服务详情的API
        // const response = await consultantAPI.getServiceById(serviceId);
        // setService(response.data);

        // 临时的占位数据
        setService({
          id: serviceId,
          title: '深度职业规划咨询',
          description: '一对一深度沟通，解决你的职业困惑，规划未来发展路径。',
          price: 500,
          duration: 60,
          consultant: {
            name: '张老师',
            avatar: '/default-avatar.png'
          }
        });

      } catch (error) {
        toast.error('加载服务信息失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate]);

  const handleConfirmBooking = async () => {
    toast('正在处理预定...');
    try {
      // 1. 创建预定 (假设需要 slotId, 但这里简化)
      // const bookingResponse = await bookingAPI.createBooking({ serviceId });
      // const bookingId = bookingResponse.data.id;

      // 2. 模拟支付
      // await bookingAPI.pay(bookingId);

      toast.success('预定成功！会议室已创建。');
      // navigate(`/booking/${bookingId}/success`); // 跳转到成功页面
      navigate(`/`); // 临时跳转回主页
    } catch (error) {
      toast.error('预定失败，请稍后再试');
    }
  };

  if (loading) {
    return <div className="text-center py-20">正在加载服务信息...</div>;
  }

  if (!service) {
    return <div className="text-center py-20">服务不存在或已下架</div>;
  }

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
      <div className="flex items-center gap-4 mb-6">
        <img src={service.consultant.avatar} alt={service.consultant.name} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-semibold">{service.consultant.name}</p>
          <p className="text-sm text-gray-600">咨询师</p>
        </div>
      </div>

      <p className="text-gray-700 mb-6">{service.description}</p>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">订单详情</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">服务时长</span>
            <span className="font-medium">{service.duration} 分钟</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">服务价格</span>
            <span className="font-medium text-lg text-primary-600">¥ {service.price}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleConfirmBooking}
          className="w-full py-3 px-6 bg-primary-600 text-white font-bold rounded-lg text-lg hover:bg-primary-700 transition-transform transform hover:scale-105"
        >
          确认支付并预定
        </button>
      </div>
    </div>
  );
}
