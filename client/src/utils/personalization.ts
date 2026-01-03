export interface PersonalizationSettings {
  sceneMode: 'work' | 'relax';
  showModules: boolean;
  clickEffectEnabled: boolean;
  petEnabled: boolean;
  showPet: boolean;
  petType: string;
  
  // 核心挂件
  showCountdown: boolean;
  countdownEnabled: boolean;
  countdownTarget: string;
  countdownPos: { x: number; y: number };
  
  showSignature: boolean;
  signatureText: string;
  signatureAlt: string;
  signatureMode: 'static' | 'gradient' | 'typing' | 'hover';
  signaturePos: { x: number; y: number };

  // 便签日程
  showNote: boolean;
  noteText: string;
  notePos: { x: number; y: number };
  showSchedule: boolean;
  scheduleText: string;
  schedulePos: { x: number; y: number };

  // 每日运势
  showFortune: boolean;
  fortuneText: string;
  fortunePos: { x: number; y: number };
}

export const DEFAULT_SETTINGS: PersonalizationSettings = {
  sceneMode: 'relax',
  showModules: false,
  clickEffectEnabled: true,
  petEnabled: true,
  showPet: true,
  petType: 'dog',
  
  showCountdown: false,
  countdownEnabled: false,
  countdownTarget: '2025-01-01',
  countdownPos: { x: 50, y: 100 },
  
  showSignature: false,
  signatureText: "保持热爱，奔赴山海",
  signatureAlt: "Keep loving, keep going",
  signatureMode: 'typing',
  signaturePos: { x: 50, y: 300 },

  showNote: false,
  noteText: "",
  notePos: { x: 400, y: 100 },

  showSchedule: false,
  scheduleText: "",
  schedulePos: { x: 400, y: 400 },

  showFortune: false,
  fortuneText: '',
  fortunePos: { x: 300, y: 200 },
};

// 兼容旧的命名（defaultSettings）
export const defaultSettings = DEFAULT_SETTINGS;

const STORAGE_KEY = 'personalization_settings_v2';

export function loadPersonalizationSettings(): PersonalizationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(saved);
    // 自动补全缺失字段，防止白屏
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function savePersonalizationSettings(settings: PersonalizationSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('personalization-updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('保存失败:', e);
  }
}
