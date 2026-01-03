// 简单的前端存储实现：用于持久化个性化页配置（主题、窗口位置、Dock 位置、已激活应用等）
// 不改动业务逻辑，只补足缺失的模块，避免构建/运行报错。

export interface PersonalizeLayout {
  windows?: Record<string, { x: number; y: number }>;
  dock?: { x: number; y: number };
}

export interface PersonalizeConfig {
  theme?: string;
  apps?: string[];
  layout?: PersonalizeLayout;
}

const STORAGE_KEY = 'personalize_config_v1';

export async function fetchConfig(): Promise<PersonalizeConfig | null> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as PersonalizeConfig;
  } catch (e) {
    console.error('读取个性化配置失败:', e);
    return null;
  }
}

export async function saveConfig(partial: PersonalizeConfig): Promise<void> {
  try {
    const existing = (await fetchConfig()) || {};
    const merged: PersonalizeConfig = {
      ...existing,
      ...partial,
      layout: {
        ...existing.layout,
        ...partial.layout,
        windows: { ...(existing.layout?.windows || {}), ...(partial.layout?.windows || {}) },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('保存个性化配置失败:', e);
  }
}


