// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { consultantAPI, orderAPI } from '@/services/api_extended';
import { useLanguage } from '@/i18n/LanguageContext';

export default function BookingCheckoutPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [service, setService] = useState<any>(null);
  const [step, setStep] = useState<'confirm' | 'pay' | 'success'>('confirm');
  const [booking, setBooking] = useState<any>(null);
  const [startAt, setStartAt] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      toast.error(t('booking.checkout.invalid_service'));
      navigate(-1);
      return;
    }

    const fetchService = async () => {
      try {
        const response = await consultantAPI.getServiceById(serviceId);
        setService(response.data);
      } catch (error) {
        toast.error(t('booking.checkout.load_failed'));
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, navigate, t]);

  const priceLabel = useMemo(() => {
    if (!service) return '';
    if (!service.currency || service.currency === 'CNY') return `¥${service.price}`;
    return `${service.price} ${service.currency}`;
  }, [service]);

  const handleCreateOrder = async () => {
    if (!startAt) {
      toast.error(t('booking.checkout.select_time'));
      return;
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      toast.error(t('booking.checkout.invalid_time'));
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
      toast.success(t('booking.checkout.order_created'));
    } catch (e) {
      toast.error(t('booking.checkout.order_failed'));
    }
  };

  const handlePay = async () => {
    if (!booking) return;
    try {
      await orderAPI.payBooking(booking.id);
      setStep('success');
      toast.success(t('booking.checkout.pay_success'));
    } catch (e) {
      toast.error(t('booking.checkout.pay_failed'));
    }
  };

  if (loading) {
    return <div className="text-center py-20">{t('booking.checkout.loading')}</div>;
  }

  if (!service) {
    return <div className="text-center py-20">{t('booking.checkout.not_found')}</div>;
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('booking.checkout.success_title')}</h2>
          <p className="text-gray-600 mb-6">{t('booking.checkout.success_body')}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/booking')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {t('booking.checkout.view_booking')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg"
            >
              {t('booking.checkout.back_home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">{t('booking.checkout.title')}</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 space-y-2">
        <h3 className="text-xl font-semibold">{service.title}</h3>
        {service.description && <p className="text-gray-500">{service.description}</p>}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
          <span>{service.durationMinutes} {t('booking.checkout.minutes')}</span>
          <span className="text-primary-600 font-semibold">{priceLabel}</span>
        </div>
      </div>

      {step === 'confirm' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('booking.checkout.select_time_label')}</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg p-3"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <textarea
            className="w-full border rounded-lg p-3"
            placeholder={t('booking.checkout.question_placeholder')}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
          />
          <button
            onClick={handleCreateOrder}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition"
          >
            {t('booking.checkout.confirm')}
          </button>
        </div>
      )}

      {step === 'pay' && (
        <div className="text-center">
          <p className="mb-6 text-gray-600">{t('booking.checkout.pay_prompt')}</p>
          <button
            onClick={handlePay}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="w-5 h-5" /> {t('booking.checkout.pay_now')}
          </button>
        </div>
      )}
    </div>
  );
}
