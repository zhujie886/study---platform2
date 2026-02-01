import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultantAPI } from '@/services/api_extended';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageContext';

export default function ConsultantProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dayLabels = useMemo(
    () => [t('周日'), t('周一'), t('周二'), t('周三'), t('周四'), t('周五'), t('周六')],
    [t]
  );

  useEffect(() => {
    if (!id) return;
    consultantAPI
      .getPublicProfile(id)
      .then((res) => setProfile(res.data))
      .catch(() => toast.error(t('加载失败')))
      .finally(() => setLoading(false));
  }, [id]);

  const normalized = useMemo(() => {
    const profileInfo = profile?.consultantProfile || {};
    const ensureArray = (value: any) => (Array.isArray(value) ? value : []);
    const availabilityRules = ensureArray(profile?.availabilityRules).slice().sort((a: any, b: any) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return String(a.startTime || '').localeCompare(String(b.startTime || ''));
    });

    return {
      profileInfo,
      skills: ensureArray(profileInfo.skills),
      portfolioLinks: ensureArray(profileInfo.portfolioLinks),
      languages: ensureArray(profileInfo.languages),
      secondaryDomains: ensureArray(profileInfo.secondaryDomains),
      projects: ensureArray(profileInfo.projects),
      certifications: ensureArray(profileInfo.certifications),
      availabilityRules
    };
  }, [profile]);

  const handleBook = (serviceId: string) => {
    navigate(`/booking/checkout/${serviceId}`);
  };

  const handleViewService = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  if (loading) return <div className="text-center py-16">{t('加载中...')}</div>;
  if (!profile) return <div className="text-center py-16">{t('未找到咨询师')}</div>;

  const ratingAvg =
    typeof normalized.profileInfo.ratingAvg === 'number'
      ? normalized.profileInfo.ratingAvg
      : profile.rating ?? 0;
  const ratingCount =
    typeof normalized.profileInfo.ratingCount === 'number' ? normalized.profileInfo.ratingCount : 0;
  const ratingValue = ratingAvg ? ratingAvg.toFixed(1) : t('暂无');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
        <img
          src={profile.avatar || '/default-avatar.png'}
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            {profile.isVerified && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">{t('已认证')}</span>
            )}
            {profile.isConsultant && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{t('咨询师')}</span>
            )}
          </div>
          {normalized.profileInfo.headline && (
            <p className="text-primary-600 font-medium mt-1">{normalized.profileInfo.headline}</p>
          )}
          {profile.bio && <p className="text-gray-600 mt-2">{profile.bio}</p>}

          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-4">
            {normalized.profileInfo.primaryDomain && (
              <span>{t('主领域：{value}', { value: normalized.profileInfo.primaryDomain })}</span>
            )}
            {normalized.secondaryDomains.length > 0 && (
              <span>{t('辅领域：{value}', { value: normalized.secondaryDomains.join(' / ') })}</span>
            )}
            {normalized.profileInfo.timezone && (
              <span>{t('时区：{value}', { value: normalized.profileInfo.timezone })}</span>
            )}
            {normalized.languages.length > 0 && (
              <span>{t('语言：{value}', { value: normalized.languages.join(' / ') })}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-4">
            <span>
              {t('评分：{value}', { value: ratingValue })} {ratingAvg > 0 && '⭐'}
            </span>
            <span>{t('评价数：{count}', { count: ratingCount })}</span>
            <span>{t('预约次数：{count}', { count: profile.totalBookings ?? 0 })}</span>
          </div>

          {normalized.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {normalized.skills.map((skill: any) => (
                <span
                  key={String(skill)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {(normalized.portfolioLinks.length > 0 || normalized.projects.length > 0 || normalized.certifications.length > 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          {normalized.portfolioLinks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('作品集与链接')}</h2>
              <div className="grid gap-2">
                {normalized.portfolioLinks.map((item: any, index: number) => {
                  const label = typeof item === 'string' ? item : item.title || item.name || item.url;
                  const url = typeof item === 'string' ? item : item.url || item.link || '';
                  return (
                    <a
                      key={`${label}-${index}`}
                      href={url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {normalized.projects.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('项目展示')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {normalized.projects.map((item: any, index: number) => {
                  const title = typeof item === 'string' ? item : item.title || item.name || t('项目');
                  const description =
                    typeof item === 'string' ? '' : item.description || item.summary || item.desc || '';
                  const link = typeof item === 'string' ? '' : item.link || item.url || '';
                  return (
                    <div key={`${title}-${index}`} className="border border-gray-100 rounded-xl p-4">
                      <div className="font-semibold">{title}</div>
                      {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          {t('查看链接')}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {normalized.certifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('证书与资质')}</h2>
              <div className="flex flex-wrap gap-2">
                {normalized.certifications.map((item: any, index: number) => {
                  const label = typeof item === 'string' ? item : item.title || item.name || item.label || t('证书');
                  return (
                    <span
                      key={`${label}-${index}`}
                      className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {normalized.availabilityRules.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-3">{t('可预约时间')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            {normalized.availabilityRules.map((rule: any) => (
              <div key={rule.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <span>{dayLabels[rule.dayOfWeek] || t('周?')}</span>
                <span>
                  {rule.startTime} - {rule.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">{t('服务套餐')}</h2>
        {profile.services?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.services.map((service: any) => (
              <div key={service.id} className="border border-gray-100 p-5 rounded-xl bg-white">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-base">{service.title}</h3>
                  <span className="text-primary-600 font-bold text-lg">￥{service.price}</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  {t('{count}分钟', { count: service.durationMinutes })} · {service.deliveryType}
                </p>
                {service.description && <p className="text-gray-600 mt-3">{service.description}</p>}

                {service.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {service.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {(service.scope || service.deliverables || service.notes) && (
                  <div className="text-sm text-gray-600 mt-3 space-y-1">
                    {service.scope && <div>{t('适用范围：{value}', { value: service.scope })}</div>}
                    {service.deliverables && <div>{t('交付物：{value}', { value: service.deliverables })}</div>}
                    {service.notes && <div>{t('购买须知：{value}', { value: service.notes })}</div>}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleViewService(service.id)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                  >
                    {t('查看详情')}
                  </button>
                  <button
                    onClick={() => handleBook(service.id)}
                    className="flex-1 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
                  >
                    {t('立即预约')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">{t('暂无可预约服务')}</div>
        )}
      </div>
    </div>
  );
}
