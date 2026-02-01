// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultantAPI } from '@/services/api_extended';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      toast.error(t('service.detail.invalid_id'));
      navigate(-1);
      return;
    }

    const fetchService = async () => {
      try {
        const response = await consultantAPI.getServiceById(serviceId);
        setService(response.data);
      } catch (error) {
        toast.error(t('service.detail.load_failed'));
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

  const handleBookNow = () => {
    navigate(`/booking/checkout/${serviceId}`);
  };

  if (loading) {
    return <div className="text-center py-20">{t('service.detail.loading')}</div>;
  }

  if (!service) {
    return <div className="text-center py-20">{t('service.detail.not_found')}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-6">
            {service.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{service.title}</h1>
              {service.description && <p className="text-gray-600 mt-2">{service.description}</p>}
            </div>

            {service.consultant && (
              <div className="flex items-center gap-4 border border-gray-100 rounded-xl p-4">
                <img
                  src={service.consultant.avatar || '/default-avatar.png'}
                  alt={service.consultant.username}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg font-semibold">{service.consultant.username}</p>
                  {service.consultant.bio && <p className="text-sm text-gray-500">{service.consultant.bio}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="border border-gray-100 rounded-xl p-4">
                <div className="text-gray-400 text-xs">{t('service.detail.duration')}</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">
                  {service.durationMinutes} {t('service.detail.minutes')}
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4">
                <div className="text-gray-400 text-xs">{t('service.detail.delivery')}</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">{service.deliveryType}</div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4">
                <div className="text-gray-400 text-xs">{t('service.detail.price')}</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">{priceLabel}</div>
              </div>
            </div>

            {(service.scope || service.deliverables || service.notes) && (
              <div className="space-y-3 text-sm text-gray-600">
                {service.scope && (
                  <div>
                    <span className="font-medium text-gray-800">{t('service.detail.scope')}</span>
                    {service.scope}
                  </div>
                )}
                {service.deliverables && (
                  <div>
                    <span className="font-medium text-gray-800">{t('service.detail.deliverables')}</span>
                    {service.deliverables}
                  </div>
                )}
                {service.notes && (
                  <div>
                    <span className="font-medium text-gray-800">{t('service.detail.notes')}</span>
                    {service.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-lg font-semibold text-gray-900">{priceLabel}</div>
            <button
              onClick={handleBookNow}
              className="w-full md:w-auto py-3 px-8 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition"
            >
              {t('service.detail.book_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
