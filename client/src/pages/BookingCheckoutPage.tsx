// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultantAPI, bookingAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export default function BookingCheckoutPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      toast.error(t('booking.checkout.invalid_service'));
      navigate(-1);
      return;
    }

    const fetchService = async () => {
      try {
        // Real API (enable when backend is ready)
        // const response = await consultantAPI.getServiceById(serviceId);
        // setService(response.data);

        // Local sample data
        setService({
          id: serviceId,
          title: t('booking.checkout.sample_title'),
          description: t('booking.checkout.sample_description'),
          price: 500,
          duration: 60,
          consultant: {
            name: t('booking.checkout.sample_consultant'),
            avatar: '/default-avatar.png'
          }
        });
      } catch (error) {
        toast.error(t('booking.checkout.load_failed'));
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate, t]);

  const handleConfirmBooking = async () => {
    toast(t('booking.checkout.processing'));
    try {
      // 1) Create order (backend should return bookingId)
      // const bookingResponse = await bookingAPI.createBooking({ serviceId });
      // const bookingId = bookingResponse.data.id;

      // 2) Confirm payment
      // await bookingAPI.pay(bookingId);

      toast.success(t('booking.checkout.pay_success'));
      // navigate(`/booking/${bookingId}/success`);
      navigate('/');
    } catch (error) {
      toast.error(t('booking.checkout.pay_failed'));
    }
  };

  if (loading) {
    return <div className="text-center py-20">{t('booking.checkout.loading')}</div>;
  }

  if (!service) {
    return <div className="text-center py-20">{t('booking.checkout.not_found')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
      <div className="flex items-center gap-4 mb-6">
        <img src={service.consultant.avatar} alt={service.consultant.name} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-semibold">{service.consultant.name}</p>
          <p className="text-sm text-gray-600">{t('booking.checkout.consultant_label')}</p>
        </div>
      </div>

      <p className="text-gray-700 mb-6">{service.description}</p>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">{t('booking.checkout.order_details')}</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('booking.checkout.duration_label')}</span>
            <span className="font-medium">
              {service.duration} {t('booking.checkout.minutes')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('booking.checkout.price_label')}</span>
            <span className="font-medium text-lg text-primary-600">￥{service.price}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleConfirmBooking}
          className="w-full py-3 px-6 bg-primary-600 text-white font-bold rounded-lg text-lg hover:bg-primary-700 transition-transform transform hover:scale-105"
        >
          {t('booking.checkout.confirm')}
        </button>
      </div>
    </div>
  );
}