import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DraggableWindow } from './personalization/DraggableWindow';
import { AchievementPanel, type Achievement } from './personalization/AchievementPanel';
import { CountdownWidget } from './personalization/CountdownWidget';
import { FortuneWidget } from './personalization/FortuneWidget';
import { MoodBottle } from './personalization/MoodBottle';
import { HabitTree } from './personalization/HabitTree';
import { TimeCapsule } from './personalization/TimeCapsule';
import { NoteWidget } from './personalization/NoteWidget';
import { DoodleNote } from './personalization/DoodleNote';

type Pos = { x: number; y: number };
type Photo = { id: number; src: string; x: number; y: number };
type Sticker = { id: number; content: string; x: number; y: number; rotate: number };
type Pendant = { id: number; label: string; x: number; y: number };

const LS = {
  photos: 'magic_dock_photos',
  stickers: 'magic_dock_stickers',
  pendants: 'magic_dock_pendants',
  achievements: 'user_achievements_v2',
  vis: 'magic_dock_visible',
  pos: {
    countdown: 'magic_dock_countdown_pos',
    fortune: 'magic_dock_fortune_pos',
    sticker: 'magic_dock_sticker_pos',
    pendant: 'magic_dock_pendant_pos',
    achievement: 'magic_dock_achievement_pos',
    mood: 'magic_dock_mood_pos',
    habit: 'magic_dock_habit_pos',
    capsule: 'magic_dock_capsule_pos',
    note: 'magic_dock_note_pos',
    doodle: 'magic_dock_doodle_pos',
  },
};

const clampPos = (p: Pos): Pos => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
  return { x: Math.max(8, Math.min(w - 320, p.x)), y: Math.max(8, Math.min(h - 360, p.y)) };
};

const DockItem = ({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -8, scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    className="relative group flex flex-col items-center justify-center"
  >
    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/0 group-hover:bg-white/40 transition-colors duration-300 border border-transparent group-hover:border-white/50 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
      <span className="text-3xl select-none">{emoji}</span>
    </div>
    <span className="absolute -top-10 px-3 py-1 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
      {label}
    </span>
  </motion.button>
);

const Divider = () => <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-400/30 to-transparent mx-2" />;

const PhotoSticker = ({ photo, onDelete }: { photo: Photo; onDelete: (id: number) => void }) => (
  <motion.div
    drag
    dragMomentum={false}
    initial={{ x: photo.x, y: photo.y, scale: 0 }}
    animate={{ scale: 1 }}
    whileHover={{ scale: 1.05, zIndex: 5010 }}
    style={{ position: 'fixed', left: 0, top: 0, zIndex: 5000 }}
    className="group"
  >
    <div className="w-40 bg-white p-2 pb-8 shadow-[0_10px_30px_rgba(0,0,0,0.2)] rounded-2xl border-[3px] border-white relative select-none">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/60 backdrop-blur rounded-sm border border-white/50 shadow-sm" />
      <div className="w-full h-36 bg-slate-100 overflow-hidden relative rounded-xl">
        <img src={photo.src} alt="Memory" className="w-full h-full object-cover pointer-events-none" />
      </div>
      <button
        onPointerDown={(e) => { e.stopPropagation(); onDelete(photo.id); }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg scale-0 group-hover:scale-100 transition-all hover:bg-rose-600"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  </motion.div>
);

const DraggableSticker = ({ item, onDelete }: { item: Sticker; onDelete: (id: number) => void }) => (
  <motion.div
    drag
    dragMomentum={false}
    initial={{ x: item.x, y: item.y, scale: 0, rotate: 0 }}
    animate={{ scale: 1, rotate: item.rotate }}
    whileHover={{ scale: 1.08, zIndex: 5010 }}
    whileDrag={{ scale: 1.1, rotate: 0 }}
    style={{ position: 'fixed', left: 0, top: 0, zIndex: 5000 }}
    className="group cursor-move select-none"
  >
    <div className="relative filter drop-shadow-xl">
      <div className="text-6xl" style={{ textShadow: '2px 2px 0px #fff, -2px -2px 0px #fff, 2px -2px 0px #fff, -2px 2px 0px #fff' }}>
        {item.content}
      </div>
      <button
        onPointerDown={(e) => { e.stopPropagation(); onDelete(item.id); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  </motion.div>
);

const DraggablePendant = ({ item, onDelete }: { item: Pendant; onDelete: (id: number) => void }) => (
  <motion.div
    drag
    dragMomentum={false}
    initial={{ x: item.x, y: item.y, scale: 0 }}
    animate={{ scale: 1 }}
    whileHover={{ zIndex: 5010 }}
    style={{ position: 'fixed', left: 0, top: 0, zIndex: 5000 }}
    className="group cursor-move select-none flex flex-col items-center"
  >
    <div className="w-0.5 h-8 bg-slate-300/80 -mb-1 origin-top" />
    <motion.div
      animate={{ rotate: [4, -4, 4] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="relative z-10 px-3 py-2 rounded-xl border-2 shadow-lg backdrop-blur-sm bg-white flex items-center gap-2"
    >
      <span className="text-xl">🎐</span>
      <span className="text-xs font-bold">{item.label}</span>
      <button
        onPointerDown={(e) => { e.stopPropagation(); onDelete(item.id); }}
        className="absolute -top-3 -right-3 w-5 h-5 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </motion.div>
  </motion.div>
);

export const MagicDock: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [pendants, setPendants] = useState<Pendant[]>([]);
  const [achItems, setAchItems] = useState<Achievement[]>([]);
  const [achInput, setAchInput] = useState('');
  const [achIcon, setAchIcon] = useState('🏆');
  const [isHydrated, setIsHydrated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCountdown, setShowCountdown] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [showStickerCenter, setShowStickerCenter] = useState(false);
  const [showPendantCenter, setShowPendantCenter] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [showHabit, setShowHabit] = useState(false);
  const [showCapsule, setShowCapsule] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showDoodle, setShowDoodle] = useState(false);

  const [countdownPos, setCountdownPos] = useState<Pos>({ x: 60, y: 120 });
  const [fortunePos, setFortunePos] = useState<Pos>({ x: 420, y: 140 });
  const [stickerPos, setStickerPos] = useState<Pos>({ x: 80, y: 320 });
  const [pendantPos, setPendantPos] = useState<Pos>({ x: 120, y: 520 });
  const [achievementPos, setAchievementPos] = useState<Pos>({ x: 140, y: 260 });
  const [moodPos, setMoodPos] = useState<Pos>({ x: 360, y: 120 });
  const [habitPos, setHabitPos] = useState<Pos>({ x: 360, y: 360 });
  const [capsulePos, setCapsulePos] = useState<Pos>({ x: 640, y: 220 });
  const [notePos, setNotePos] = useState<Pos>({ x: 760, y: 120 });
  const [doodlePos, setDoodlePos] = useState<Pos>({ x: 760, y: 360 });

  useEffect(() => {
    const safeParse = <T,>(s: string | null): T | null => {
      if (!s) return null;
      try { return JSON.parse(s) as T; } catch { return null; }
    };
    const p = safeParse<Photo[]>(localStorage.getItem(LS.photos)); if (p) setPhotos(p);
    const s = safeParse<Sticker[]>(localStorage.getItem(LS.stickers)); if (s) setStickers(s);
    const pd = safeParse<Pendant[]>(localStorage.getItem(LS.pendants)); if (pd) setPendants(pd);
    const ach = safeParse<Achievement[]>(localStorage.getItem(LS.achievements)); if (ach) setAchItems(ach);

    const loadPos = (key: keyof typeof LS.pos, setter: (v: Pos) => void) => {
      const val = safeParse<Pos>(localStorage.getItem(LS.pos[key]));
      if (val) setter(clampPos(val));
    };
    loadPos('countdown', setCountdownPos);
    loadPos('fortune', setFortunePos);
    loadPos('sticker', setStickerPos);
    loadPos('pendant', setPendantPos);
    loadPos('achievement', setAchievementPos);
    loadPos('mood', setMoodPos);
    loadPos('habit', setHabitPos);
    loadPos('capsule', setCapsulePos);
    loadPos('note', setNotePos);
    loadPos('doodle', setDoodlePos);

    const vis = safeParse<Record<string, boolean>>(localStorage.getItem(LS.vis));
    if (vis) {
      setShowCountdown(!!vis.countdown);
      setShowFortune(!!vis.fortune);
      setShowStickerCenter(!!vis.sticker);
      setShowPendantCenter(!!vis.pendant);
      setShowAchievement(!!vis.achievement);
      setShowMood(!!vis.mood);
      setShowHabit(!!vis.habit);
      setShowCapsule(!!vis.capsule);
      setShowNote(!!vis.note);
      setShowDoodle(!!vis.doodle);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS.photos, JSON.stringify(photos.slice(-20)));
  }, [photos, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS.stickers, JSON.stringify(stickers));
  }, [stickers, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS.pendants, JSON.stringify(pendants));
  }, [pendants, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LS.achievements, JSON.stringify(achItems));
  }, [achItems, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    const vis = {
      countdown: showCountdown,
      fortune: showFortune,
      sticker: showStickerCenter,
      pendant: showPendantCenter,
      achievement: showAchievement,
      mood: showMood,
      habit: showHabit,
      capsule: showCapsule,
      note: showNote,
      doodle: showDoodle,
    };
    localStorage.setItem(LS.vis, JSON.stringify(vis));
  }, [
    showCountdown,
    showFortune,
    showStickerCenter,
    showPendantCenter,
    showAchievement,
    showMood,
    showHabit,
    showCapsule,
    showNote,
    showDoodle,
    isHydrated,
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newPhoto: Photo = {
        id: Date.now(),
        src: ev.target?.result as string,
        x: Math.max(40, (window.innerWidth || 1920) / 2 - 80),
        y: Math.max(40, (window.innerHeight || 1080) / 2 - 80),
      };
      setPhotos(prev => [...prev.slice(-19), newPhoto]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addSticker = (content: string) => {
    const newSticker: Sticker = {
      id: Date.now(),
      content,
      x: (window.innerWidth || 1920) / 2 - 50 + (Math.random() - 0.5) * 40,
      y: (window.innerHeight || 1080) / 2 - 50 + (Math.random() - 0.5) * 40,
      rotate: (Math.random() - 0.5) * 20,
    };
    setStickers(prev => [...prev, newSticker]);
  };

  const addPendant = (label: string) => {
    const newPendant: Pendant = {
      id: Date.now(),
      label,
      x: (window.innerWidth || 1920) / 2 - 40,
      y: (window.innerHeight || 1080) / 2 - 120,
    };
    setPendants(prev => [...prev, newPendant]);
  };

  const addAchievement = () => {
    if (!achInput.trim()) return;
    setAchItems(prev => [...prev, { id: Date.now(), text: achInput.trim(), icon: achIcon }]);
    setAchInput('');
  };

  const clearAllWidgets = () => {
    setPhotos([]);
    setStickers([]);
    setPendants([]);
    setShowCountdown(false);
    setShowFortune(false);
    setShowStickerCenter(false);
    setShowPendantCenter(false);
    setShowAchievement(false);
    setShowMood(false);
    setShowHabit(false);
    setShowCapsule(false);
    setShowNote(false);
    setShowDoodle(false);
  };

  const fireThemeToggle = () => {
    window.dispatchEvent(new CustomEvent('magic-theme-toggle'));
  };

  const savePos = (key: keyof typeof LS.pos, pos: Pos) => localStorage.setItem(LS.pos[key], JSON.stringify(clampPos(pos)));

  return (
    <>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

      <AnimatePresence>
        {photos.map(p => <PhotoSticker key={p.id} photo={p} onDelete={(id) => setPhotos(prev => prev.filter(x => x.id !== id))} />)}
        {stickers.map(s => <DraggableSticker key={s.id} item={s} onDelete={(id) => setStickers(prev => prev.filter(x => x.id !== id))} />)}
        {pendants.map(p => <DraggablePendant key={p.id} item={p} onDelete={(id) => setPendants(prev => prev.filter(x => x.id !== id))} />)}
      </AnimatePresence>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.12}
        initial={{ y: 200, x: '-20%', opacity: 0 }}
        animate={{ y: 0, x: '-20%', opacity: 1 }}
        style={{ position: 'fixed', left: '40%', bottom: '30px', zIndex: 9999 }}
        className="flex items-center gap-4 p-3 px-8 bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.15),0_0_20px_rgba(255,255,255,0.5)_inset] rounded-[2.5rem] cursor-grab active:cursor-grabbing"
      >
        <DockItem emoji="🖼️" label="贴照片" onClick={() => fileInputRef.current?.click()} />
        <DockItem emoji="🏷️" label="贴纸" onClick={() => setShowStickerCenter(true)} />
        <DockItem emoji="🎐" label="挂件" onClick={() => setShowPendantCenter(true)} />
        <DockItem emoji="🏆" label="成就墙" onClick={() => setShowAchievement(true)} />
        <DockItem emoji="🌦️" label="天气瓶" onClick={() => setShowMood(true)} />
        <DockItem emoji="🌳" label="习惯树" onClick={() => setShowHabit(true)} />
        <DockItem emoji="⌛" label="时光胶囊" onClick={() => setShowCapsule(true)} />
        <DockItem emoji="📝" label="便签" onClick={() => setShowNote(true)} />
        <DockItem emoji="🎨" label="涂鸦" onClick={() => setShowDoodle(true)} />
        <Divider />
        <DockItem emoji="⏰" label="倒计时" onClick={() => setShowCountdown(true)} />
        <DockItem emoji="🔮" label="求签" onClick={() => setShowFortune(true)} />
        <DockItem emoji="🧹" label="清空" onClick={clearAllWidgets} />
      </motion.div>

      <AnimatePresence>
        {showCountdown && (
          <DraggableWindow id="dock-countdown" initialX={countdownPos.x} initialY={countdownPos.y} onSave={(_, pos) => { setCountdownPos(pos); savePos('countdown', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-5 border border-white/50 min-w-[280px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">⏰ 倒计时</span>
                <button onClick={() => setShowCountdown(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <CountdownWidget target={new Date().toISOString()} minimal={false} />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFortune && (
          <DraggableWindow id="dock-fortune" initialX={fortunePos.x} initialY={fortunePos.y} onSave={(_, pos) => { setFortunePos(pos); savePos('fortune', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-5 border border-white/50 min-w-[280px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">🔮 今日运势</span>
                <button onClick={() => setShowFortune(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <FortuneWidget />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStickerCenter && (
          <DraggableWindow id="dock-sticker" initialX={stickerPos.x} initialY={stickerPos.y} onSave={(_, pos) => { setStickerPos(pos); savePos('sticker', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 border border-white/50 min-w-[320px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-bold text-slate-700 ml-1">🏷️ 贴纸中心</span>
                <button onClick={() => setShowStickerCenter(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['✨', '🌸', '🍓', '🧸', '🌈', '⭐', '☁️', '💖', '🍀'].map((emoji, i) => (
                  <div
                    key={i}
                    onClick={() => addSticker(emoji)}
                    className="aspect-square flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer group active:scale-95"
                  >
                    <span className="text-4xl drop-shadow-sm group-hover:animate-pulse">{emoji}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-[10px] text-slate-400">点击添加到画面</div>
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPendantCenter && (
          <DraggableWindow id="dock-pendant" initialX={pendantPos.x} initialY={pendantPos.y} onSave={(_, pos) => { setPendantPos(pos); savePos('pendant', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 border border-white/50 min-w-[320px]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-bold text-slate-700 ml-1">🎐 挂件中心</span>
                <button onClick={() => setShowPendantCenter(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['心愿挂件', '天空挂件', '宠物挂件', '风铃挂件'].map((item) => (
                  <div
                    key={item}
                    onClick={() => addPendant(item)}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer text-center text-sm text-slate-600 font-bold active:scale-95 hover:border-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-[10px] text-slate-400">点击挂件放置到屏幕</div>
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievement && (
          <DraggableWindow id="dock-achievement" initialX={achievementPos.x} initialY={achievementPos.y} onSave={(_, pos) => { setAchievementPos(pos); savePos('achievement', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}>
              <AchievementPanel
                items={achItems}
                onAdd={addAchievement}
                onClose={() => setShowAchievement(false)}
                icon={achIcon}
                setIcon={setAchIcon}
                input={achInput}
                setInput={setAchInput}
              />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMood && (
          <DraggableWindow id="dock-mood" initialX={moodPos.x} initialY={moodPos.y} onSave={(_, pos) => { setMoodPos(pos); savePos('mood', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-4 border border-white/50 min-w-[320px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">🌦️ 天气瓶</span>
                <button onClick={() => setShowMood(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <MoodBottle onClose={() => setShowMood(false)} />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHabit && (
          <DraggableWindow id="dock-habit" initialX={habitPos.x} initialY={habitPos.y} onSave={(_, pos) => { setHabitPos(pos); savePos('habit', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-4 border border-white/50 min-w-[340px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">🌳 习惯树</span>
                <button onClick={() => setShowHabit(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <HabitTree onClose={() => setShowHabit(false)} />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCapsule && (
          <DraggableWindow id="dock-capsule" initialX={capsulePos.x} initialY={capsulePos.y} onSave={(_, pos) => { setCapsulePos(pos); savePos('capsule', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-4 border border-white/50 min-w-[340px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">⌛ 时光胶囊</span>
                <button onClick={() => setShowCapsule(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <TimeCapsule onClose={() => setShowCapsule(false)} />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNote && (
          <DraggableWindow id="dock-note" initialX={notePos.x} initialY={notePos.y} onSave={(_, pos) => { setNotePos(pos); savePos('note', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-4 border border-white/50 min-w-[280px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">📝 便签</span>
                <button onClick={() => setShowNote(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <NoteWidget />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDoodle && (
          <DraggableWindow id="dock-doodle" initialX={doodlePos.x} initialY={doodlePos.y} onSave={(_, pos) => { setDoodlePos(pos); savePos('doodle', pos); }} zIndex={9999}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[2rem] p-4 border border-white/50 min-w-[320px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-bold text-slate-700 ml-1">🎨 涂鸦</span>
                <button onClick={() => setShowDoodle(false)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">×</button>
              </div>
              <DoodleNote onClose={() => setShowDoodle(false)} />
            </motion.div>
          </DraggableWindow>
        )}
      </AnimatePresence>
    </>
  );
};


