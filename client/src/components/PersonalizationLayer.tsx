import { useEffect, useState } from 'react';
import { loadPersonalizationSettings, savePersonalizationSettings, type PersonalizationSettings, DEFAULT_SETTINGS } from '@/utils/personalization';
import { ClickEffectLayer } from './personalization/ClickEffectLayer';

export function PersonalizationLayer() {
  const [settings, setSettings] = useState<PersonalizationSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(loadPersonalizationSettings());
    setMounted(true);
    const handler = () => setSettings(loadPersonalizationSettings());
    window.addEventListener('personalization-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('personalization-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  if (!mounted) return null;

  const updateSettings = (updates: Partial<PersonalizationSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    savePersonalizationSettings(next);
  };

  const getPos = (pos: any, defaultPos: any) => {
      if (pos && typeof pos.x === 'number') return pos;
      return defaultPos || { x: 50, y: 50 };
  };

  const isWorkMode = settings.sceneMode === 'work';

  return (
    <>
      {settings.clickEffectEnabled && !isWorkMode && <ClickEffectLayer />}
    </>
  );
}


