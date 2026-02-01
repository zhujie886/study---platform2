import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export type Achievement = { id: number; text: string; icon: string };

interface AchievementPanelProps {
  items: Achievement[];
  onAdd: () => void;
  onClose: () => void;
  icon: string;
  setIcon: (s: string) => void;
  input: string;
  setInput: (s: string) => void;
}

const ICONS = ["🏆", "🎯", "✨", "🌟", "💡", "🔥", "📚", "✅", "💪", "🌈", "🥇", "🎉"];

const PROMPT_KEYS = [
  'achievement.prompt.long_task',
  'achievement.prompt.solve_issue',
  'achievement.prompt.new_skill',
  'achievement.prompt.effective_comm',
  'achievement.prompt.good_habit',
  'achievement.prompt.make_clear',
  'achievement.prompt.extra_step',
  'achievement.prompt.take_rest',
];

const QUICK_CHIP_KEYS = [
  'achievement.quick.note_page',
  'achievement.quick.review',
  'achievement.quick.code',
  'achievement.quick.tidy',
  'achievement.quick.todo',
  'achievement.quick.sleep',
];

type SortKey = 'new' | 'old' | 'pinned';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeLevel(count: number) {
  // 玩法：每 5 条升级一次
  const level = Math.floor(count / 5) + 1;
  const inLevel = count % 5;
  const progress = inLevel / 5; // 0..1
  const xp = count * 10;
  const nextLevelAt = (level * 5) * 10;
  const labelKey =
    level >= 8 ? 'achievement.level.master' :
    level >= 6 ? 'achievement.level.expert' :
    level >= 4 ? 'achievement.level.advanced' :
    level >= 2 ? 'achievement.level.novice' : 'achievement.level.beginner';
  return { level, progress, xp, nextLevelAt, labelKey };
}

function safeCopy(text: string) {
  if (typeof navigator === 'undefined') return;
  navigator.clipboard?.writeText(text).catch(() => void 0);
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({
  items,
  onAdd,
  onClose,
  icon,
  setIcon,
  input,
  setInput,
}) => {
  const count = items.length;
  const { t } = useLanguage();
  const { level, progress, xp, labelKey } = computeLevel(count);

  // Local “玩法”状态：不影响外部逻辑，不要求后端字段
  const [query, setQuery] = React.useState('');
  const [sortKey, setSortKey] = React.useState<SortKey>('new');
  const [goal, setGoal] = React.useState(6);
  const [celebrate, setCelebrate] = React.useState(true);
  const [pinned, setPinned] = React.useState<Record<number, boolean>>({});
  const [toast, setToast] = React.useState<string | null>(null);
  const [burstKey, setBurstKey] = React.useState(0);
  const [highlightId, setHighlightId] = React.useState<number | null>(null);
  const [openId, setOpenId] = React.useState<number | null>(null);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const prevCountRef = React.useRef<number>(count);

  // 当外部 items 增加时：自动 toast + 轻量庆祝 + 高亮新卡片
  React.useEffect(() => {
    const prev = prevCountRef.current;
    if (count > prev && items.length > 0) {
      const newest = items.reduce((a, b) => (b.id > a.id ? b : a), items[0]);
      setHighlightId(newest.id);
      setToast(t('achievement.toast_added', { icon: newest.icon, text: newest.text }));
      if (celebrate) setBurstKey((k) => k + 1);

      const t1 = window.setTimeout(() => setToast(null), 2400);
      const t2 = window.setTimeout(() => setHighlightId(null), 1800);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    prevCountRef.current = count;
  }, [count, items, celebrate, t]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.slice();

    if (q) {
      list = list.filter((it) => (it.text || '').toLowerCase().includes(q) || (it.icon || '').includes(q));
    }

    const isPinned = (id: number) => !!pinned[id];

    list.sort((a, b) => {
      if (sortKey === 'pinned') {
        const ap = isPinned(a.id) ? 1 : 0;
        const bp = isPinned(b.id) ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return b.id - a.id;
      }
      if (sortKey === 'old') return a.id - b.id;
      return b.id - a.id; // new
    });

    return list;
  }, [items, query, sortKey, pinned]);

  const pinnedCount = React.useMemo(() => Object.values(pinned).filter(Boolean).length, [pinned]);
  const goalProgress = clamp(goal <= 0 ? 0 : count / goal, 0, 1);

  const togglePin = (id: number) => {
    setPinned((m) => ({ ...m, [id]: !m[id] }));
  };

  const randomPrompt = () => {
    const key = PROMPT_KEYS[Math.floor(Math.random() * PROMPT_KEYS.length)];
    setInput(t(key));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const quickFill = (s: string) => {
    setInput(s);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const openItem = (id: number) => setOpenId(id);
  const closeModal = () => setOpenId(null);

  const modalItem = openId == null ? null : items.find((x) => x.id === openId) || null;

  return (
    <div className="relative w-full max-w-[420px]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-2 -z-10">
        <div className="absolute left-6 top-6 h-28 w-28 rounded-full bg-yellow-300/35 blur-2xl" />
        <div className="absolute right-4 top-10 h-28 w-28 rounded-full bg-orange-300/30 blur-2xl" />
        <div className="absolute left-10 bottom-6 h-32 w-32 rounded-full bg-sky-300/25 blur-2xl" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute left-1/2 top-2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-white/60 bg-white/85 px-4 py-2 text-[12px] font-semibold text-slate-800 shadow-lg backdrop-blur">
            {toast}
          </div>
        </div>
      )}

      {/* Confetti burst (lightweight) */}
      <div className="pointer-events-none absolute right-6 top-[94px] z-20">
        <Burst key={burstKey} />
      </div>

      <div className="relative overflow-hidden rounded-[1.8rem] border border-white/50 bg-white/80 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/70 to-transparent" />

        {/* Header */}
        <div className="relative px-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 shadow-md ring-1 ring-white/60">
                <span className="text-xl">🏆</span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-extrabold tracking-tight text-slate-800">{t('achievement.title')}</span>
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {t('achievement.count_summary', { count, pinnedCount })}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-700/80">
                    {t('achievement.level_label', { level })} {t(labelKey)}
                  </span>
                  <span>{t('achievement.xp', { xp })}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-500 ring-1 ring-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-200"
            >
              <span className="text-lg leading-none transition-transform group-hover:rotate-90">×</span>
            </button>
          </div>

          {/* Level progress bar */}
          <div className="mt-3 rounded-2xl bg-white/60 p-3 ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{t('achievement.level_progress')}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-[width]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>

            {/* Goal */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                {t('achievement.goal_label', { count, goal })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGoal((g) => clamp(g - 1, 1, 99))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-[14px] font-bold text-slate-600 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
                  aria-label={t('achievement.goal_decrease')}
                >
                  –
                </button>
                <button
                  onClick={() => setGoal((g) => clamp(g + 1, 1, 99))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-[14px] font-bold text-slate-600 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
                  aria-label={t('achievement.goal_increase')}
                >
                  +
                </button>
                <label className="ml-1 inline-flex items-center gap-2 rounded-xl bg-white/70 px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-900/10">
                  <input
                    type="checkbox"
                    checked={celebrate}
                    onChange={(e) => setCelebrate(e.target.checked)}
                    className="h-3 w-3 accent-yellow-400"
                  />
                  {t('achievement.celebrate')}
                </label>
              </div>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-300 to-yellow-300 transition-[width]"
                style={{ width: `${Math.round(goalProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls: search + sort */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-2xl bg-white/70 px-3 ring-1 ring-slate-900/10 focus-within:shadow-[0_0_0_4px_rgba(148,163,184,0.18)]">
              <span className="text-[12px] text-slate-400">?</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('achievement.search_placeholder')}
                className="h-10 flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="rounded-full bg-slate-900/5 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-900/10"
                >
                  {t('achievement.clear')}
                </button>
              )}
            </div>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-10 rounded-2xl bg-white/70 px-3 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-900/10 outline-none hover:bg-white"
              aria-label={t('achievement.sort')}
            >
              <option value="new">{t('achievement.sort_new')}</option>
              <option value="old">{t('achievement.sort_old')}</option>
              <option value="pinned">{t('achievement.sort_pinned')}</option>
            </select>
          </div>
        </div>

        {/* Icon picker */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold text-slate-600">{t('achievement.icon_sticker')}</div>
            <button
              onClick={randomPrompt}
              className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-900/10"
              title={t('achievement.random_prompt')}
            >
              {t('achievement.random_prompt')}
            </button>
          </div>

          <div
            className={[
              'mt-2 flex gap-2 overflow-x-auto pb-2',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            ].join(' ')}
          >
            {ICONS.map((e) => {
              const selected = icon === e;
              return (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  title={t('achievement.icon_select', { icon: e })}
                  aria-label={t('achievement.icon_select_label', { icon: e })}
                  className={[
                    'relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg transition-all',
                    'ring-1 ring-slate-900/10 bg-white/60 hover:bg-white hover:shadow',
                    selected ? 'scale-[1.03] ring-2 ring-yellow-300 shadow-md' : 'hover:-translate-y-0.5',
                  ].join(' ')}
                >
                  <span className={selected ? 'drop-shadow-sm' : ''}>{e}</span>
                  {selected && (
                    <span className="pointer-events-none absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-yellow-300 text-[10px] font-black text-slate-800 ring-2 ring-white">
                      ?
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick chips */}
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_CHIP_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => quickFill(t(key))}
                className="rounded-full bg-white/65 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
                title={t('achievement.quick_fill')}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 pt-4">
          <div className="flex gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900/5 to-slate-900/0 ring-1 ring-slate-900/10">
              <span className="text-xl">{icon}</span>
            </div>

            <div className="relative flex flex-1 items-center gap-2 rounded-2xl bg-white/70 px-3 ring-1 ring-slate-900/10 transition-shadow focus-within:shadow-[0_0_0_4px_rgba(250,204,21,0.22)]">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                placeholder={t('achievement.input_placeholder')}
                className="h-10 flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
              />

              <button
                onClick={onAdd}
                className={[
                  'relative inline-flex h-8 items-center justify-center rounded-xl px-3 text-[12px] font-extrabold text-white',
                  'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-sm transition-all',
                  'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
                ].join(' ')}
              >
                {t('achievement.add')}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="px-5 pb-5 pt-4">
          {filtered.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/60 p-5 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-yellow-200/60 to-orange-200/60 ring-1 ring-white/70">
                <span className="text-2xl">?</span>
              </div>
              <div className="text-[13px] font-semibold text-slate-700">
                {count === 0 ? t('achievement.empty_title') : t('achievement.empty_no_match')}
              </div>
              <div className="mt-1 text-[12px] text-slate-500">
                {count === 0 ? t('achievement.empty_hint') : t('achievement.empty_search_hint')}
              </div>

              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-yellow-200/40 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-sky-200/35 blur-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((it) => {
                const isPinned = !!pinned[it.id];
                const isHighlight = highlightId === it.id;
                return (
                  <div
                    key={it.id}
                    className={[
                      'group relative overflow-hidden rounded-2xl border border-white/60 bg-white/65 p-3',
                      'shadow-sm ring-1 ring-slate-900/5 transition-all',
                      'hover:-translate-y-0.5 hover:bg-white hover:shadow-md',
                      isHighlight ? 'ring-2 ring-yellow-300 shadow-md' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => openItem(it.id)}
                        className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900/5 to-slate-900/0 ring-1 ring-slate-900/10 hover:shadow"
                        title={t('achievement.expand')}
                        aria-label={t('achievement.expand')}
                      >
                        <span className="text-2xl drop-shadow-sm">{it.icon}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePin(it.id)}
                          className={[
                            'inline-flex h-7 w-7 items-center justify-center rounded-xl ring-1 ring-slate-900/10 transition-all',
                            isPinned ? 'bg-yellow-200/70 text-slate-800' : 'bg-white/70 text-slate-600 hover:bg-white',
                          ].join(' ')}
                          title={isPinned ? t('achievement.unpin') : t('achievement.pin')}
                          aria-label={isPinned ? t('achievement.unpin') : t('achievement.pin')}
                        >
                          {isPinned ? '📌' : '📍'}
                        </button>

                        <button
                          onClick={() => {
                            safeCopy(`${it.icon} ${it.text}`);
                            setToast(t('achievement.copied'));
                            window.setTimeout(() => setToast(null), 1200);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/70 text-slate-600 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
                          title={t('achievement.copy')}
                          aria-label={t('achievement.copy')}
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="truncate text-[12px] font-semibold text-slate-800" title={it.text}>
                        {it.text}
                      </div>
                      <button
                        onClick={() => openItem(it.id)}
                        className="mt-1 text-[11px] font-semibold text-slate-500 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={t('achievement.view_detail')}
                      >
                        {t('achievement.view_detail')}
                      </button>
                    </div>

                    <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-yellow-200/35 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="absolute bottom-2 right-2 rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      #{it.id}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('achievement.hint')}</span>
            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-500">{t('achievement.playable_badge')}</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={closeModal}>
          <div
            className="w-full max-w-[520px] rounded-[1.6rem] border border-white/50 bg-white/85 p-4 shadow-2xl backdrop-blur-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-slate-900/5 to-slate-900/0 ring-1 ring-slate-900/10">
                  <span className="text-3xl">{modalItem.icon}</span>
                </div>
                <div>
                  <div className="text-[14px] font-extrabold text-slate-800">{t('achievement.detail_title')}</div>
                  <div className="mt-0.5 text-[12px] text-slate-500">{t('achievement.id_label', { id: modalItem.id })}</div>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
                aria-label={t('achievement.close_detail')}
              >
                ×
              </button>
            </div>

            <div className="mt-3 rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/10">
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800">
                {modalItem.text}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => togglePin(modalItem.id)}
                className="rounded-2xl bg-white/70 px-4 py-2 text-[12px] font-extrabold text-slate-700 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
              >
                {pinned[modalItem.id] ? t('achievement.unpin') : t('achievement.pin')}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    safeCopy(`${modalItem.icon} ${modalItem.text}`);
                    setToast(t('achievement.copied'));
                    window.setTimeout(() => setToast(null), 1200);
                  }}
                  className="rounded-2xl bg-white/70 px-4 py-2 text-[12px] font-extrabold text-slate-700 ring-1 ring-slate-900/10 hover:bg-white hover:shadow"
                >
                  {t('achievement.copy')}
                </button>
                <button
                  onClick={closeModal}
                  className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 text-[12px] font-extrabold text-white shadow-sm hover:shadow-md"
                >
                  {t('achievement.ok')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Local styles for burst */}
      <style>{`
        @keyframes ap-burst-fade {
          0% { opacity: 0; transform: scale(0.7); }
          12% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        @keyframes ap-particle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const Burst: React.FC = () => {
  // 轻量粒子：不依赖任何库
  const parts = React.useMemo(() => {
    const base = [
      { dx: -18, dy: -22 }, { dx: 10, dy: -26 }, { dx: 26, dy: -10 },
      { dx: 24, dy: 16 }, { dx: 6, dy: 26 }, { dx: -18, dy: 22 },
      { dx: -26, dy: 6 }, { dx: -24, dy: -8 },
    ];
    return base.map((p, i) => ({
      ...p,
      delay: i * 0.02,
      size: 6 + (i % 3),
    }));
  }, []);

  return (
    <div className="relative h-10 w-10" style={{ animation: 'ap-burst-fade 1.2s ease-out both' }}>
      {parts.map((p, idx) => (
        <span
          key={idx}
          className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/80"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `ap-particle 0.75s ease-out ${p.delay}s both`,
            // CSS variables for movement
            ['--dx' as any]: `${p.dx}px`,
            ['--dy' as any]: `${p.dy}px`,
          }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12px] font-black text-slate-700">
        ?
      </span>
    </div>
  );
};


