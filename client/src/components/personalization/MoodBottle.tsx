import React, { useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";



type MoodType = "happy" | "normal" | "sad";



type MoodEntryV2 = {

  date: string; // YYYY-MM-DD

  mood: MoodType;

  intensity: 1 | 2 | 3 | 4 | 5;

  note?: string;

};



const STORAGE_KEY_LEGACY = "user_mood_history";

const STORAGE_KEY_V2 = "user_mood_history_v2";



const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));



function todayKey(d = new Date()): string {

  const yyyy = d.getFullYear();

  const mm = String(d.getMonth() + 1).padStart(2, "0");

  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;

}



function safeJsonParse<T>(raw: string | null): T | null {

  if (!raw) return null;

  try {

    return JSON.parse(raw) as T;

  } catch {

    return null;

  }

}



function isMoodType(x: any): x is MoodType {

  return x === "happy" || x === "normal" || x === "sad";

}



function normalizeHistory(): MoodEntryV2[] {

  // v2 preferred

  const v2 = safeJsonParse<MoodEntryV2[]>(localStorage.getItem(STORAGE_KEY_V2));

  if (

    Array.isArray(v2) &&

    v2.every((e) => e && typeof e === "object" && typeof (e as any).date === "string" && isMoodType((e as any).mood))

  ) {

    return v2

      .map((e) => ({

        date: e.date,

        mood: e.mood,

        intensity: (clamp((e as any).intensity ?? 3, 1, 5) as any) as MoodEntryV2["intensity"],

        note: typeof e.note === "string" ? e.note.slice(0, 200) : undefined,

      }))

      .slice(-7);

  }



  // legacy: string[]

  const legacy = safeJsonParse<MoodType[]>(localStorage.getItem(STORAGE_KEY_LEGACY));

  if (Array.isArray(legacy) && legacy.every(isMoodType)) {

    const base = legacy.slice(-3);

    const today = new Date();



    const entries: MoodEntryV2[] = base.map((m, idx) => {

      const d = new Date(today);

      d.setDate(today.getDate() - (base.length - 1 - idx));

      return { date: todayKey(d), mood: m, intensity: 3 };

    });



    try {

      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(entries));

    } catch {

      // ignore

    }

    return entries;

  }



  // default seed

  const seed: MoodEntryV2[] = [

    { date: todayKey(new Date(Date.now() - 2 * 24 * 3600 * 1000)), mood: "sad", intensity: 3 },

    { date: todayKey(new Date(Date.now() - 1 * 24 * 3600 * 1000)), mood: "normal", intensity: 3 },

    { date: todayKey(), mood: "happy", intensity: 4 },

  ];

  return seed.slice(-7);

}



function saveHistory(entries: MoodEntryV2[]) {

  try {

    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(entries.slice(-7)));

    localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(entries.slice(-3).map((e) => e.mood)));

  } catch {

    // ignore

  }

}

function ensureTodayEntry(entries: MoodEntryV2[]): MoodEntryV2[] {

  const today = todayKey();

  if (entries.some((e) => e.date === today)) return entries;

  const latest = entries[entries.length - 1];

  const nextEntry: MoodEntryV2 = {

    date: today,

    mood: latest?.mood ?? "normal",

    intensity: (latest?.intensity ?? 3) as MoodEntryV2["intensity"],

    note: "",

  };

  const next = [...entries, nextEntry].sort((a, b) => a.date.localeCompare(b.date));

  const limited = next.slice(-7);

  saveHistory(limited);

  return limited;

}


function weekdayCN(dateKey: string): string {

  const d = new Date(`${dateKey}T00:00:00`);

  const map = ["日", "一", "二", "三", "四", "五", "六"];

  const w = map[d.getDay()] ?? "";

  return `周${w}`;

}



function shortMD(dateKey: string): string {

  const [yyyy, mm, dd] = dateKey.split("-");

  if (!mm || !dd) return dateKey;

  return `${mm}/${dd}`;

}



function moodLabel(m: MoodType): string {

  if (m === "happy") return "开心";

  if (m === "normal") return "一般";

  return "低落";

}



function moodTagline(m: MoodType): string {

  if (m === "happy") return "晴空气泡 · 轻快上升";

  if (m === "normal") return "雾白苏打 · 平稳呼吸";

  return "雨夜靛蓝 · 慢慢沉淀";

}



function moodHint(m: MoodType): string {

  if (m === "happy") return "把好事记下来，快乐会更长久。";

  if (m === "normal") return "稳定也是一种能力，给自己一点肯定。";

  return "今天不必强撑，允许自己慢一点。";

}



type MoodVisual = {

  bg: string;

  liquidA: string;

  liquidB: string;

  glow: string;

  deco: string;

  particle: string;

  accent: string;

};



function getVisual(m: MoodType): MoodVisual {

  switch (m) {

    case "happy":
      return {
        bg: "radial-gradient(900px 500px at 20% 0%, rgba(56,189,248,0.36), transparent 55%), radial-gradient(900px 600px at 80% 100%, rgba(253,230,138,0.40), transparent 56%), linear-gradient(145deg, rgba(255,255,255,0.92), rgba(240,249,255,0.92))",
        liquidA: "rgba(125,211,252,0.95)",
        liquidB: "rgba(56,189,248,0.85)",
        glow: "rgba(56,189,248,0.40)",
        deco: "✨",
        particle: "🌼",
        accent: "#0ea5e9",
      };
    case "normal":
      return {
        bg: "radial-gradient(900px 500px at 25% 0%, rgba(148,163,184,0.25), transparent 58%), radial-gradient(900px 600px at 70% 100%, rgba(203,213,225,0.35), transparent 56%), linear-gradient(145deg, rgba(255,255,255,0.92), rgba(241,245,249,0.94))",
        liquidA: "rgba(203,213,225,0.92)",
        liquidB: "rgba(148,163,184,0.86)",
        glow: "rgba(148,163,184,0.35)",
        deco: "☁️",
        particle: "🍃",
        accent: "#64748b",
      };
    case "sad":
      return {
        bg: "radial-gradient(900px 520px at 18% 0%, rgba(99,102,241,0.35), transparent 55%), radial-gradient(900px 600px at 82% 100%, rgba(129,140,248,0.28), transparent 56%), linear-gradient(145deg, rgba(255,255,255,0.92), rgba(238,242,255,0.94))",
        liquidA: "rgba(129,140,248,0.92)",
        liquidB: "rgba(99,102,241,0.86)",
        glow: "rgba(99,102,241,0.40)",
        deco: "🌧️",
        particle: "💧",
        accent: "#4f46e5",
      };
  }

}



function intensityLabel(v: number): string {

  if (v <= 1) return "很轻";

  if (v === 2) return "偏轻";

  if (v === 3) return "适中";

  if (v === 4) return "偏强";

  return "很强";

}



function computeFill(m: MoodType, intensity: number): number {

  const base = m === "sad" ? 0.72 : m === "happy" ? 0.58 : 0.50;

  const tweak = (intensity - 3) * 0.03;

  return clamp(base + tweak, 0.22, 0.86);

}



function frequentMood(entries: MoodEntryV2[]): MoodType {

  const counts: Record<MoodType, number> = { happy: 0, normal: 0, sad: 0 };

  for (const e of entries) counts[e.mood] += 1;

  const best = (Object.keys(counts) as MoodType[]).sort((a, b) => counts[b] - counts[a])[0];

  return best ?? "normal";

}



function trend(entries: MoodEntryV2[]): "up" | "down" | "flat" {

  if (entries.length < 2) return "flat";

  const score = (m: MoodType) => (m === "happy" ? 2 : m === "normal" ? 1 : 0);

  const a = score(entries[entries.length - 2].mood);

  const b = score(entries[entries.length - 1].mood);

  if (b > a) return "up";

  if (b < a) return "down";

  return "flat";

}



const Icon = ({ path, className }: { path: string; className?: string }) => (

  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">

    <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

  </svg>

);



export const MoodBottle = ({ onClose }: { onClose: () => void }) => {

  const [history, setHistory] = useState<MoodEntryV2[]>([]);

  const [mood, setMood] = useState<MoodType>("happy");

  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);

  const [note, setNote] = useState<string>("");



  const [shakeNonce, setShakeNonce] = useState(0);

  const [editingDay, setEditingDay] = useState<string>(todayKey());

  const [toast, setToast] = useState<string | null>(null);



  const [expanded, setExpanded] = useState<boolean>(false);

  const [historyOpen, setHistoryOpen] = useState<boolean>(false);



  const toastTimer = useRef<number | null>(null);



  const showToast = (msg: string) => {

    setToast(msg);

    if (toastTimer.current) window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => setToast(null), 2100);

  };



  useEffect(() => {

    let entries = normalizeHistory();
    entries = ensureTodayEntry(entries);

    setHistory(entries);



    const t = todayKey();

    const latest = entries[entries.length - 1];

    const todayEntry = entries.find((e) => e.date === t);

    const base = todayEntry ?? latest;



    if (base) {

      setMood(base.mood);

      setIntensity(base.intensity ?? 3);

      setNote(base.note ?? "");

      setEditingDay(base.date);

    }

  }, []);



  useEffect(() => {

    return () => {

      if (toastTimer.current) window.clearTimeout(toastTimer.current);

    };

  }, []);



  const visual = useMemo(() => getVisual(mood), [mood]);

  const fill = useMemo(() => computeFill(mood, intensity), [mood, intensity]);



  const today = useMemo(() => todayKey(), []);

  const hasToday = useMemo(() => history.some((e) => e.date === today), [history, today]);



  const insights = useMemo(() => {

    const scope = history.slice(-7);

    const best = frequentMood(scope);

    const t = trend(scope);

    return { best, t };

  }, [history]);



  const isEditingToday = editingDay === today;



  const upsertEntry = (entry: MoodEntryV2) => {

    setHistory((prev) => {

      const next = [...prev];

      const idx = next.findIndex((e) => e.date === entry.date);

      if (idx >= 0) next[idx] = entry;

      else next.push(entry);



      next.sort((a, b) => a.date.localeCompare(b.date));

      const limited = next.slice(-7);



      saveHistory(limited);

      return limited;

    });

  };



  const applyMood = (m: MoodType) => {

    setMood(m);

    setShakeNonce((n) => n + 1);

  };



  const saveDay = () => {

    const entry: MoodEntryV2 = {

      date: editingDay,

      mood,

      intensity,

      note: note.trim() ? note.trim().slice(0, 200) : undefined,

    };

    upsertEntry(entry);

    showToast(editingDay === today ? "已记录今日心情" : "已保存这一天的心情");

  };



  const loadDay = (day: string) => {

    const found = history.find((e) => e.date === day);

    if (found) {

      setEditingDay(found.date);

      setMood(found.mood);

      setIntensity(found.intensity);

      setNote(found.note ?? "");

      setShakeNonce((n) => n + 1);

      showToast(`已切换到 ${shortMD(day)}`);

      return;

    }

    setEditingDay(day);

    setMood("normal");

    setIntensity(3);

    setNote("");

    setShakeNonce((n) => n + 1);

  };



  const addQuickNote = (txt: string) => {

    const base = note.trim();

    const next = base ? `${base}；${txt}` : txt;

    setNote(next.slice(0, 200));

  };



  const statsLabel = useMemo(() => {

    const best = moodLabel(insights.best);

    const t = insights.t === "up" ? "↗" : insights.t === "down" ? "↘" : "→";

    return `近 7 天：偏 ${best} ${t}`;

  }, [insights]);



  const particles = useMemo(() => {

    const seed = shakeNonce;

    return Array.from({ length: 9 }).map((_, i) => {

      const r = Math.sin((seed + 1) * 999 + i * 77) * 10000;

      const x = (r - Math.floor(r)) * 100;

      const delay = ((Math.cos((seed + 1) * 333 + i * 91) + 1) / 2) * 1.4;

      const dur = 2.6 + ((Math.sin((seed + 1) * 141 + i * 31) + 1) / 2) * 1.4;

      const size = 10 + ((Math.cos((seed + 1) * 201 + i * 11) + 1) / 2) * 10;

      return { id: `${seed}_${i}`, x, delay, dur, size };

    });

  }, [shakeNonce]);



  // Layout: less tall, more wide, optional expand

  const shellMaxH = expanded ? "92vh" : "78vh";



  return (

    <div

      className={[

        "rounded-[38px] border border-white/60 overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.16)] relative",

        "w-[520px] max-w-[96vw]",

      ].join(" ")}

      style={{

        background: visual.bg,

        backdropFilter: "blur(14px)",

        maxHeight: shellMaxH,

      }}

    >

      {/* Ambient glow blobs */}

      <div

        className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-60"

        style={{ background: `radial-gradient(circle at 30% 30%, ${visual.glow}, transparent 62%)` }}

      />

      <div

        className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full blur-3xl opacity-45"

        style={{ background: `radial-gradient(circle at 40% 40%, ${visual.glow}, transparent 64%)` }}

      />



      {/* Top actions */}

      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">

        <button

          onClick={() => setExpanded((v) => !v)}

          className="w-9 h-9 flex items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-700 hover:bg-white/90 transition"

          title={expanded ? "收起" : "展开"}

          type="button"

        >

          <Icon

            className="w-5 h-5"

            path={

              expanded

                ? "M9 9H5V5M15 15H19V19M5 9V5H9M19 15V19H15"

                : "M5 9V5H9M19 15V19H15M9 19H5V15M15 5H19V9"

            }

          />

        </button>

        <button

          onClick={onClose}

          className="w-9 h-9 flex items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-600 hover:bg-white/90 transition"

          title="关闭"

          type="button"

        >

          ?

        </button>

      </div>



      {/* Shell: header fixed + body scroll */}

      <div className="relative z-10 flex flex-col" style={{ maxHeight: shellMaxH }}>

        {/* Header */}

        <div className="px-6 pt-6 pb-4 shrink-0">

          <div className="flex items-start justify-between gap-4 pr-16">

            <div className="min-w-0">

              <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500 uppercase">Mood Potion</div>

              <div className="mt-2 text-[18px] font-black text-slate-900 leading-tight">

                心情瓶

                <span className="ml-2 text-[12px] font-semibold text-slate-500">· {moodTagline(mood)}</span>

              </div>

              <div className="mt-1 text-[12px] text-slate-600">{moodHint(mood)}</div>

            </div>



            <div className="shrink-0 text-right hidden sm:block">

              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Insights</div>

              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[12px] font-bold text-slate-700">

                <span className="w-2 h-2 rounded-full" style={{ background: visual.accent }} />

                <span className="tabular-nums">{statsLabel}</span>

              </div>

            </div>

          </div>



          {/* Compact insights on small screens */}

          <div className="sm:hidden mt-3 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[12px] font-bold text-slate-700">

            <span className="w-2 h-2 rounded-full" style={{ background: visual.accent }} />

            <span className="tabular-nums">{statsLabel}</span>

          </div>

        </div>



        {/* Body */}

        <div className="px-6 pb-6 flex-1 overflow-auto">

          {/* Main: 2 columns on desktop to reduce height */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Bottle stage */}

            <div className="rounded-[32px] border border-white/60 bg-white/55 p-4 backdrop-blur overflow-hidden relative">

              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <div className="text-[12px] font-extrabold text-slate-700">

                    {shortMD(editingDay)} · {weekdayCN(editingDay)}

                    {!isEditingToday && <span className="ml-2 text-[11px] font-semibold text-slate-500">（历史回看）</span>}

                  </div>

                  <div className="mt-1 text-[11px] text-slate-500">

                    强度：{intensityLabel(intensity)} · {moodLabel(mood)}

                  </div>

                </div>



                <div className="flex items-center gap-2 shrink-0">

                  <button

                    type="button"

                    onClick={() => {

                      setShakeNonce((n) => n + 1);

                      showToast("摇一摇：气泡刷新");

                    }}

                    className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 hover:bg-white/90 transition"

                    title="摇一摇"

                  >

                    摇一摇

                  </button>

                  <button

                    type="button"

                    onClick={saveDay}

                    className="rounded-2xl px-3 py-2 text-sm font-extrabold border border-white/60 bg-white/80 hover:bg-white transition"

                    title="保存"

                  >

                    保存

                  </button>

                </div>

              </div>



              <div className="mt-3 flex items-center justify-center">

                <motion.div

                  className="relative"

                  animate={{ rotate: [0, -1.4, 1.4, 0] }}

                  transition={{ duration: 0.85, ease: "easeInOut" }}

                  key={shakeNonce}

                >

                  <div

                    className="w-[172px] h-[260px] rounded-[60px] border-[5px] shadow-inner overflow-hidden relative"

                    style={{

                      borderColor: "rgba(255,255,255,0.78)",

                      background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",

                      boxShadow: "inset 0 12px 22px rgba(255,255,255,0.35), inset 0 -18px 28px rgba(0,0,0,0.10)",

                    }}

                  >

                    <div className="absolute top-8 left-6 w-6 h-40 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[1px]" />

                    <div className="absolute top-10 right-5 w-3 h-34 rounded-full bg-gradient-to-b from-white/55 to-transparent blur-[1px]" />



                    <div

                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-[128px] h-[66px] rounded-[34px] border-[5px]"

                      style={{

                        borderColor: "rgba(255,255,255,0.78)",

                        background: "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.06))",

                      }}

                    />

                    <div

                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-[110px] h-[18px] rounded-full"

                      style={{ background: "rgba(255,255,255,0.55)" }}

                    />



                    <motion.div

                      className="absolute bottom-0 left-0 w-full"

                      initial={{ height: "52%" }}

                      animate={{ height: `${Math.round(fill * 100)}%` }}

                      transition={{ duration: 1.2, type: "spring", bounce: 0.16 }}

                      style={{

                        background: `linear-gradient(180deg, ${visual.liquidA}, ${visual.liquidB})`,

                        opacity: 0.92,

                      }}

                    >

                      <motion.div

                        className="absolute -top-6 left-0 w-[210%] h-12 opacity-55"

                        style={{

                          background:

                            "radial-gradient(50% 60% at 50% 50%, rgba(255,255,255,0.45), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.22), transparent)",

                          borderRadius: "999px",

                          mixBlendMode: "screen",

                        }}

                        animate={{ x: ["-55%", "0%"] }}

                        transition={{

                          repeat: Infinity,

                          duration: mood === "sad" ? 4.0 : mood === "happy" ? 2.8 : 3.4,

                          ease: "linear",

                        }}

                      />



                      <div

                        className="absolute inset-0 opacity-70"

                        style={{

                          background:

                            "radial-gradient(140px 190px at 40% 20%, rgba(255,255,255,0.40), transparent 55%), radial-gradient(150px 230px at 70% 70%, rgba(255,255,255,0.20), transparent 58%)",

                        }}

                      />



                      <div className="absolute inset-0 overflow-hidden">

                        {particles.map((p) => (

                          <motion.div

                            key={p.id}

                            className="absolute select-none"

                            style={{ left: `${p.x}%`, bottom: -28, fontSize: `${p.size}px` }}

                            initial={{ y: 260, opacity: 0 }}

                            animate={{ y: -110, opacity: [0, 0.95, 0] }}

                            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}

                          >

                            {visual.particle}
                          </motion.div>

                        ))}

                      </div>

                    </motion.div>



                    <motion.div

                      key={`${mood}_${shakeNonce}`}

                      initial={{ y: -20, opacity: 0, scale: 0.97 }}

                      animate={{ y: 8, opacity: 1, scale: 1 }}

                      transition={{ duration: 0.5, ease: "easeOut" }}

                      className="absolute top-3 w-full text-center text-[40px] drop-shadow-md"

                    >

                      {visual.deco}

                    </motion.div>

                  </div>



                  <div className="mx-auto mt-3 h-5 w-40 rounded-full blur-md opacity-40" style={{ background: "rgba(0,0,0,0.18)" }} />

                </motion.div>

              </div>



              <AnimatePresence>

                {toast && (

                  <motion.div

                    initial={{ opacity: 0, y: 10, scale: 0.98 }}

                    animate={{ opacity: 1, y: 0, scale: 1 }}

                    exit={{ opacity: 0, y: 10, scale: 0.98 }}

                    className="absolute left-1/2 -translate-x-1/2 bottom-3 z-20 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-[12px] font-bold text-slate-700 shadow-[0_10px_28px_rgba(0,0,0,0.10)]"

                  >

                    {toast}

                  </motion.div>

                )}

              </AnimatePresence>

            </div>



            {/* Controls */}

            <div className="rounded-[32px] border border-white/60 bg-white/60 p-4 backdrop-blur">

              <div className="flex items-center justify-between">

                <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Current Mood</div>

                <div className="text-[11px] font-semibold text-slate-500">

                  {isEditingToday ? (hasToday ? "今日已记录，可覆盖" : "今日未记录") : "历史回看可覆盖保存"}

                </div>

              </div>



              <div className="mt-3 flex justify-center gap-4">

                <button

                  type="button"

                  onClick={() => applyMood("happy")}

                  className={[

                    "text-2xl p-3 rounded-2xl transition-all shadow-sm border border-white/60 bg-white/75 hover:bg-white",

                    mood === "happy" ? "ring-2 ring-sky-300 scale-110 -translate-y-[4px]" : "",

                  ].join(" ")}

                  title="开心"

                >

                  😄
                </button>

                <button

                  type="button"

                  onClick={() => applyMood("normal")}

                  className={[

                    "text-2xl p-3 rounded-2xl transition-all shadow-sm border border-white/60 bg-white/75 hover:bg-white",

                    mood === "normal" ? "ring-2 ring-slate-300 scale-110 -translate-y-[4px]" : "",

                  ].join(" ")}

                  title="一般"

                >

                  😐
                </button>

                <button

                  type="button"

                  onClick={() => applyMood("sad")}

                  className={[

                    "text-2xl p-3 rounded-2xl transition-all shadow-sm border border-white/60 bg-white/75 hover:bg-white",

                    mood === "sad" ? "ring-2 ring-indigo-300 scale-110 -translate-y-[4px]" : "",

                  ].join(" ")}

                  title="低落"

                >

                  😔
                </button>

              </div>



              <div className="mt-4">

                <div className="flex items-center justify-between">

                  <div className="text-[12px] font-extrabold text-slate-800">强度</div>

                  <div className="text-[12px] font-bold text-slate-600 tabular-nums">

                    {intensity} / 5 · {intensityLabel(intensity)}

                  </div>

                </div>

                <div className="mt-3 px-1">

                  <input

                    type="range"

                    min={1}

                    max={5}

                    step={1}

                    value={intensity}

                    onChange={(e) => setIntensity(clamp(Number(e.target.value) || 3, 1, 5) as any)}

                    className="w-full"

                    style={{ accentColor: visual.accent as any }}

                  />

                  <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-500">

                    <span>轻</span>

                    <span>适中</span>

                    <span>强</span>

                  </div>

                </div>

              </div>



              <div className="mt-4">

                <div className="flex items-center justify-between">

                  <div className="text-[12px] font-extrabold text-slate-800">一句话记录</div>

                  <div className="text-[11px] font-semibold text-slate-500">{note.length}/200</div>

                </div>

                <textarea

                  value={note}

                  onChange={(e) => setNote(e.target.value.slice(0, 200))}

                  placeholder="例如：今天把最难的部分搞定了；或：有点累，想早点休息。"

                  className="mt-2 w-full min-h-[74px] resize-none rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"

                  style={{ boxShadow: "inset 0 10px 24px rgba(0,0,0,0.05)" }}

                />

                <div className="mt-2 flex flex-wrap gap-2">

                  {["进展不错", "有点累", "心里很轻", "被打断好多次", "想吃点好吃的", "需要一点安静"].map((t) => (

                    <button

                      key={t}

                      type="button"

                      onClick={() => addQuickNote(t)}

                      className="rounded-full px-3 py-1 text-[12px] font-bold border border-white/60 bg-white/70 hover:bg-white transition"

                    >

                      {t}

                    </button>

                  ))}

                </div>



                <div className="mt-3 flex items-center gap-2">

                  <button

                    type="button"

                    onClick={saveDay}

                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold border border-white/60 bg-white/80 hover:bg-white transition shadow-[0_10px_28px_rgba(0,0,0,0.08)]"

                  >

                    保存记录

                  </button>

                  <button

                    type="button"

                    onClick={() => {

                      setMood("normal");

                      setIntensity(3);

                      setNote("");

                      setShakeNonce((n) => n + 1);

                      showToast("已重置编辑内容");

                    }}

                    className="rounded-2xl px-4 py-3 text-sm font-semibold border border-white/60 bg-white/70 hover:bg-white/90 transition"

                  >

                    清空

                  </button>

                </div>

              </div>

            </div>



            {/* History (collapsible to prevent extra height) */}

            <div className="lg:col-span-2 rounded-[32px] border border-white/60 bg-white/60 p-4 backdrop-blur">

              <button

                type="button"

                onClick={() => setHistoryOpen((v) => !v)}

                className="w-full flex items-center justify-between gap-3"

                title="展开/收起历史"

              >

                <div className="text-left">

                  <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-500">History</div>

                  <div className="mt-1 text-[12px] text-slate-600">近 7 天 · 点击切换日期</div>

                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[12px] font-bold text-slate-700">

                  <span>{historyOpen ? "收起" : "展开"}</span>

                  <span className="text-slate-500">{historyOpen ? "?" : "?"}</span>

                </div>

              </button>



              <div className="mt-3 grid grid-cols-7 gap-2">

                {history.slice(-7).map((e) => {

                  const v = getVisual(e.mood);

                  const active = e.date === editingDay;

                  return (

                    <button

                      key={e.date}

                      type="button"

                      onClick={() => loadDay(e.date)}

                      className={[

                        "rounded-2xl border p-2 text-center transition overflow-hidden",

                        "bg-white/70 border-white/60 hover:bg-white",

                        active ? "ring-2 ring-emerald-200 -translate-y-[2px]" : "",

                      ].join(" ")}

                      title={`${e.date} · ${moodLabel(e.mood)} · 强度 ${e.intensity}`}

                    >

                      <div className="text-[10px] font-extrabold text-slate-600 tabular-nums">{shortMD(e.date)}</div>

                      <div className="mt-1 text-[10px] font-semibold text-slate-500">{weekdayCN(e.date)}</div>

                      <div className="mt-2 mx-auto h-2 w-2 rounded-full" style={{ background: v.accent }} />

                      <div className="mt-2 text-[12px]">{e.mood === "happy" ? "😄" : e.mood === "normal" ? "😐" : "😔"}</div>
                    </button>

                  );

                })}

              </div>



              <AnimatePresence initial={false}>

                {historyOpen && (

                  <motion.div

                    initial={{ height: 0, opacity: 0 }}

                    animate={{ height: "auto", opacity: 1 }}

                    exit={{ height: 0, opacity: 0 }}

                    transition={{ duration: 0.22, ease: "easeOut" }}

                    className="overflow-hidden"

                  >

                    <div className="mt-3 text-[12px] text-slate-600">

                      当前查看：

                      <span className="ml-1 font-extrabold text-slate-800">{shortMD(editingDay)}</span>

                      <span className="mx-2 text-slate-400">·</span>

                      <span className="font-semibold">{moodLabel(mood)}</span>

                      <span className="mx-2 text-slate-400">·</span>

                      <span className="font-semibold">强度 {intensity}/5</span>

                    </div>



                    {note.trim() ? (

                      <div className="mt-2 rounded-2xl border border-white/60 bg-white/75 p-3 text-[12px] text-slate-700">

                        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Note</div>

                        <div className="mt-1 font-semibold leading-relaxed">{note.trim()}</div>

                      </div>

                    ) : (

                      <div className="mt-2 text-[12px] text-slate-500">这一天没有记录文字。</div>

                    )}

                  </motion.div>

                )}

              </AnimatePresence>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};





