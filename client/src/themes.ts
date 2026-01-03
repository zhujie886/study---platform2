export interface Theme {
  name: string; 
  type: 'simple' | 'gorgeous';
  styles: Record<string, string>;
  effects?: { particles: boolean; };
}

const baseSimple = {
  panelBg: 'rgba(255,255,255,0.96)',
  panelBorder: 'rgba(0,0,0,0.05)',
};

const themeList: Theme[] = [];

// 12 大主题定义
const definitions = [
  // 1. Sakura
  ['Sakura', '#fff0f5', '#9d174d', 'linear-gradient(to bottom, #fff0f5 0%, #fce7f3 100%)', '#be123c', '#f472b6', 'rgba(255,255,255,0.6)'],
  // 2. Van Gogh
  ['Van Gogh', '#fffbeb', '#1e3a8a', 'linear-gradient(135deg, #020617 0%, #172554 100%)', '#fef3c7', '#fbbf24', 'rgba(0,0,0,0.6)'],
  // 3. Greek
  ['Greek', '#fafaf9', '#57534e', 'linear-gradient(to bottom, #f5f5f4 0%, #d6d3d1 100%)', '#451a03', '#d97706', 'rgba(255,255,255,0.7)'],
  // 4. Monet
  ['Monet', '#f0fdfa', '#115e59', 'linear-gradient(120deg, #ccfbf1 0%, #e9d5ff 100%)', '#0f766e', '#2dd4bf', 'rgba(255,255,255,0.5)'],
  // 5. Klimt
  ['Klimt', '#fff7ed', '#451a03', 'radial-gradient(circle, #271a0c 0%, #000000 100%)', '#fcd34d', '#fbbf24', 'rgba(0,0,0,0.7)'],
  // 6. Da Vinci
  ['Da Vinci', '#fff8eb', '#451a03', 'radial-gradient(circle, #451a03 0%, #292524 100%)', '#fef3c7', '#d97706', 'rgba(69,26,3,0.7)'],
  // 7-12
  ['Cyber', '#f3f4f6', '#111827', '#000000', '#4ade80', '#22c55e', 'rgba(0,20,0,0.8)'],
  ['Ocean', '#ecfeff', '#0c4a6e', 'linear-gradient(to top, #0c4a6e 0%, #0369a1 100%)', '#e0f2fe', '#38bdf8', 'rgba(12,74,110,0.6)'],
  ['Forest', '#f0fdf4', '#14532d', 'linear-gradient(120deg, #14532d 0%, #166534 100%)', '#dcfce7', '#4ade80', 'rgba(20,83,45,0.6)'],
  ['Nebula', '#faf5ff', '#581c87', 'radial-gradient(circle at top right, #581c87, #020617)', '#f3e8ff', '#d8b4fe', 'rgba(88,28,135,0.6)'],
  ['Snow', '#f8fafc', '#334155', 'linear-gradient(to bottom, #e2e8f0 0%, #cbd5e1 100%)', '#1e293b', '#64748b', 'rgba(255,255,255,0.5)'],
  ['Ink', '#fafafa', '#171717', '#e5e5e5', '#000000', '#171717', 'rgba(255,255,255,0.8)']
];

definitions.forEach(([name, simpleBg, simpleText, fancyBg, fancyText, primary, fancyPanelBg]) => {
  themeList.push({
    name: `${name} · 简约`,
    type: 'simple',
    styles: {
      '--background-main': simpleBg, '--text-main': simpleText, '--text-muted': simpleText + '80',
      '--primary-color': primary, '--secondary-color': primary, '--accent-color': primary,
      '--panel-bg': baseSimple.panelBg, '--panel-border': baseSimple.panelBorder,
    },
    effects: { particles: false }
  });

  themeList.push({
    name: `${name} · 华丽`,
    type: 'gorgeous',
    styles: {
      '--background-main': fancyBg, '--text-main': fancyText, '--text-muted': fancyText + '99',
      '--primary-color': primary, '--secondary-color': primary, '--accent-color': primary,
      '--panel-bg': fancyPanelBg, '--panel-border': fancyText + '20',
    },
    effects: { particles: true }
  });
});

export const themes = themeList;