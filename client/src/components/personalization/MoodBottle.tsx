import React, { useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";



type MoodType = "happy" | "normal" | "sad";
type Translate = (key: string, vars?: Record<string, string | number>) => string;



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


function weekdayLabel(dateKey: string, t: Translate, lang: "zh" | "en"): string {
  const d = new Date(`${dateKey}T00:00:00`);
  const map = [
    "mood.weekday.sun",
    "mood.weekday.mon",
    "mood.weekday.tue",
    "mood.weekday.wed",
    "mood.weekday.thu",
    "mood.weekday.fri",
    "mood.weekday.sat",
  ];
  const key = map[d.getDay()];
  if (!key) return "";
  return lang === "zh" ? `${t("mood.weekday.prefix")}${t(key)}` : t(key);
}



function shortMD(dateKey: string): string {

  const [yyyy, mm, dd] = dateKey.split("-");

  if (!mm || !dd) return dateKey;

  return `${mm}/${dd}`;

}



function moodLabel(m: MoodType, t: Translate): string {

  if (m === "happy") return t("mood.label.happy");

  if (m === "normal") return t("mood.label.normal");

  return t("mood.label.low");

}



function moodTagline(m: MoodType, t: Translate): string {

  if (m === "happy") return t("mood.tagline.happy");

  if (m === "normal") return t("mood.tagline.normal");

  return t("mood.tagline.low");

}



function moodHint(m: MoodType, t: Translate): string {

  if (m === "happy") return t("mood.hint.happy");

  if (m === "normal") return t("mood.hint.normal");

  return t("mood.hint.low");

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



function intensityLabel(v: number, t: Translate): string {

  if (v <= 1) return t("mood.intensity.very_light");

  if (v === 2) return t("mood.intensity.light");

  if (v === 3) return t("mood.intensity.medium");

  if (v === 4) return t("mood.intensity.strong");

  return t("mood.intensity.very_strong");

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
  const { t, lang } = useLanguage();

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

    showToast(editingDay === today ? t("mood.toast.saved_today") : t("mood.toast.saved_day"));

  };



  const loadDay = (day: string) => {

    const found = history.find((e) => e.date === day);

    if (found) {

      setEditingDay(found.date);

      setMood(found.mood);

      setIntensity(found.intensity);

      setNote(found.note ?? "");

      setShakeNonce((n) => n + 1);

      showToast(t("mood.toast.switched_date", { date: shortMD(day) }));

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



  const quickNotes = useMemo(
    () => [
      "mood.quick_note.progress",
      "mood.quick_note.tired",
      "mood.quick_note.light",
      "mood.quick_note.interrupted",
      "mood.quick_note.tasty",
      "mood.quick_note.quiet",
    ].map((key) => t(key)),
    [t]
  );

  const statsLabel = useMemo(() => {

    const best = moodLabel(insights.best, t);

    const trendArrow = insights.t === "up" ? "↗" : insights.t === "down" ? "↘" : "→";

    return t("mood.trend.summary", { best, arrow: trendArrow });

  }, [insights, t]);



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

          title={expanded ? t("mood.action.collapse") : t("mood.action.expand")}

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

          title={t("mood.action.close")}

          type="button"

        >

          \u00D7

        </button>

      </div>



      {/* Shell: header fixed + body scroll */}

      <div className="relative z-10 flex flex-col" style={{ maxHeight: shellMaxH }}>

        {/* Header */}

        <div className="px-6 pt-6 pb-4 shrink-0">

          <div className="flex items-start justify-between gap-4 pr-16">

            <div className="min-w-0">

              <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500 uppercase">{t("mood.title.elixir")}</div>

              <div className="mt-2 text-[18px] font-black text-slate-900 leading-tight">

                {t("mood.title.bottle")}

                <span className="ml-2 text-[12px] font-semibold text-slate-500">· {moodTagline(mood, t)}</span>

              </div>

              <div className="mt-1 text-[12px] text-slate-600">{moodHint(mood, t)}</div>

            </div>



            <div className="shrink-0 text-right hidden sm:block">

              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("mood.title.trend")}</div>

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

                    {shortMD(editingDay)} · {weekdayLabel(editingDay, t, lang)}

                    {!isEditingToday && <span className="ml-2 text-[11px] font-semibold text-slate-500">{t("mood.note.history_view")}</span>}

                  </div>

                  <div className="mt-1 text-[11px] text-slate-500">

                    {t("mood.label.intensity")}：{intensityLabel(intensity, t)} · {moodLabel(mood, t)}

                  </div>

                </div>



                <div className="flex items-center gap-2 shrink-0">

                  <button

                    type="button"

                    onClick={() => {

                      setShakeNonce((n) => n + 1);

                      showToast(t("mood.toast.shake_refresh"));

                    }}

                    className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 hover:bg-white/90 transition"

                    title={t("mood.action.shake")}

                  >

                    {t("mood.action.shake")}

                  </button>

                  <button

                    type="button"

                    onClick={saveDay}

                    className="rounded-2xl px-3 py-2 text-sm font-extrabold border border-white/60 bg-white/80 hover:bg-white transition"

                    title={t("mood.action.save")}

                  >

                    {t("mood.action.save")}

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

                <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{t("mood.section.choose")}</div>

                <div className="text-[11px] font-semibold text-slate-500">

                  {isEditingToday ? (hasToday ? t("mood.note.today_recorded") : t("mood.note.today_not_recorded")) : t("mood.note.history_overwrite")}

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

                  title={t("mood.label.happy")}

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

                  title={t("mood.label.normal")}

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

                  title={t("mood.label.low")}

                >

                  😔
                </button>

              </div>



              <div className="mt-4">

                <div className="flex items-center justify-between">

                  <div className="text-[12px] font-extrabold text-slate-800">{t("mood.label.intensity")}</div>

                  <div className="text-[12px] font-bold text-slate-600 tabular-nums">

                    {intensity} / 5 · {intensityLabel(intensity, t)}

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

                    <span>{t("mood.intensity.short_light")}</span>

                    <span>{t("mood.intensity.short_medium")}</span>

                    <span>{t("mood.intensity.short_strong")}</span>

                  </div>

                </div>

              </div>



              <div className="mt-4">

                <div className="flex items-center justify-between">

                  <div className="text-[12px] font-extrabold text-slate-800">{t("mood.section.one_line")}</div>

                  <div className="text-[11px] font-semibold text-slate-500">{note.length}/200</div>

                </div>

                <textarea

                  value={note}

                  onChange={(e) => setNote(e.target.value.slice(0, 200))}

                  placeholder={t("mood.placeholder.note")}

                  className="mt-2 w-full min-h-[74px] resize-none rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"

                  style={{ boxShadow: "inset 0 10px 24px rgba(0,0,0,0.05)" }}

                />

                <div className="mt-2 flex flex-wrap gap-2">

                  {quickNotes.map((item) => (

                    <button

                      key={item}

                      type="button"

                      onClick={() => addQuickNote(item)}

                      className="rounded-full px-3 py-1 text-[12px] font-bold border border-white/60 bg-white/70 hover:bg-white transition"

                    >

                      {item}

                    </button>

                  ))}

                </div>



                <div className="mt-3 flex items-center gap-2">

                  <button

                    type="button"

                    onClick={saveDay}

                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold border border-white/60 bg-white/80 hover:bg-white transition shadow-[0_10px_28px_rgba(0,0,0,0.08)]"

                  >

                    {t("mood.action.save_record")}

                  </button>

                  <button

                    type="button"

                    onClick={() => {

                      setMood("normal");

                      setIntensity(3);

                      setNote("");

                      setShakeNonce((n) => n + 1);

                      showToast(t("mood.toast.reset"));

                    }}

                    className="rounded-2xl px-4 py-3 text-sm font-semibold border border-white/60 bg-white/70 hover:bg-white/90 transition"

                  >

                    {t("mood.action.clear")}

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

                title={t("mood.action.toggle_history")}

              >

                <div className="text-left">

                  <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{t("mood.section.history")}</div>

                  <div className="mt-1 text-[12px] text-slate-600">{t("mood.note.history_hint")}</div>

                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[12px] font-bold text-slate-700">

                  <span>{historyOpen ? t("mood.action.collapse") : t("mood.action.expand")}</span>

                  <span className="text-slate-500">{historyOpen ? "\u25B2" : "\u25BC"}</span>

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

                      title={`${e.date} · ${moodLabel(e.mood, t)} · ${t("mood.label.intensity")} ${e.intensity}`}

                    >

                      <div className="text-[10px] font-extrabold text-slate-600 tabular-nums">{shortMD(e.date)}</div>

                      <div className="mt-1 text-[10px] font-semibold text-slate-500">{weekdayLabel(e.date, t, lang)}</div>

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

                      {t("mood.note.current_view")}

                      <span className="ml-1 font-extrabold text-slate-800">{shortMD(editingDay)}</span>

                      <span className="mx-2 text-slate-400">·</span>

                      <span className="font-semibold">{moodLabel(mood, t)}</span>

                      <span className="mx-2 text-slate-400">·</span>

                      <span className="font-semibold">{t("mood.label.intensity")} {intensity}/5</span>

                    </div>



                    {note.trim() ? (

                      <div className="mt-2 rounded-2xl border border-white/60 bg-white/75 p-3 text-[12px] text-slate-700">

                        <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{t("mood.section.record")}</div>

                        <div className="mt-1 font-semibold leading-relaxed">{note.trim()}</div>

                      </div>

                    ) : (

                      <div className="mt-2 text-[12px] text-slate-500">{t("mood.note.no_record")}</div>

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






