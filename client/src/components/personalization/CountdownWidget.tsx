import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

type Mode = "datetime" | "duration";

interface Props {
  /**
   * Target time. Any value accepted by `new Date(target)` (ISO recommended).
   * Example: "2025-12-31T23:59:59"
   */
  target: string;

  /** Compact pill UI */
  minimal?: boolean;

  /** Show seconds column (default true). */
  showSeconds?: boolean;

  /** Allow user to open settings and change the target time (default true). */
  editable?: boolean;

  /** Optional title displayed in full mode. */
  title?: string;

  /** Optional subtitle displayed under title in full mode. */
  subtitle?: string;

  /**
   * Persist user settings/target in localStorage.
   * If provided, the widget will restore the last target/mode/toggles on next load.
   */
  persistKey?: string;

  /** Called once when countdown reaches zero. */
  onReached?: () => void;

  /** Initial settings mode (default "datetime"). */
  defaultMode?: Mode;
}

type TimeParts = {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  reached: boolean;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const pad2 = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");

function parseTargetMs(target: string): number | null {
  const ms = new Date(target).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatTarget(ms: number, locale: string): string {
  try {
    return new Date(ms).toLocaleString(locale, { hour12: false });
  } catch {
    return new Date(ms).toISOString();
  }
}

function splitTime(diffMs: number): TimeParts {
  const reached = diffMs <= 0;
  const safe = Math.max(0, diffMs);

  const totalSeconds = Math.floor(safe / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return { days, hours, mins, secs, reached };
}

type PersistState = {
  mode: Mode;
  targetMs: number;
  showSeconds: boolean;
};

function loadPersist(key: string): PersistState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistState>;
    if (!data || typeof data !== "object") return null;

    const mode: Mode = data.mode === "duration" ? "duration" : "datetime";
    const targetMs = typeof data.targetMs === "number" && Number.isFinite(data.targetMs) ? data.targetMs : NaN;
    const showSeconds = typeof data.showSeconds === "boolean" ? data.showSeconds : true;

    if (!Number.isFinite(targetMs)) return null;
    return { mode, targetMs, showSeconds };
  } catch {
    return null;
  }
}

function savePersist(key: string, state: PersistState) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const CountdownWidget: React.FC<Props> = ({
  target,
  minimal = false,
  showSeconds: showSecondsProp = true,
  editable = true,
  title,
  subtitle,
  persistKey,
  onReached,
  defaultMode = "datetime",
}) => {
  const { t, lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "zh-CN";
  const titleText = title ?? t("countdown.title");
  const subtitleText = subtitle ?? t("countdown.subtitle");
  const labelText = t("countdown.label");
  const originalTargetMsRef = useRef<number | null>(parseTargetMs(target));

  const persisted = useMemo(() => (persistKey ? loadPersist(persistKey) : null), [persistKey]);

  const [mode, setMode] = useState<Mode>(persisted?.mode ?? defaultMode);
  const [showSeconds, setShowSeconds] = useState<boolean>(persisted?.showSeconds ?? showSecondsProp);

  const [targetMs, setTargetMs] = useState<number>(() => {
    const p = persisted?.targetMs;
    if (typeof p === "number" && Number.isFinite(p)) return p;

    const parsed = parseTargetMs(target);
    // If parsing fails, default to 30 minutes from now (still usable)
    return parsed ?? Date.now() + 30 * 60 * 1000;
  });

  const [running, setRunning] = useState<boolean>(true);
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const [durationInput, setDurationInput] = useState({ hh: 0, mm: 25, ss: 0 });
  const [dateTimeInput, setDateTimeInput] = useState<string>(() => toDatetimeLocalValue(targetMs));

  const reachedOnceRef = useRef(false);

  // Keep input synced when target changes (unless user is actively editing settings).
  useEffect(() => {
    if (!settingsOpen) {
      setDateTimeInput(toDatetimeLocalValue(targetMs));
    }
  }, [targetMs, settingsOpen]);

  // Persist on relevant changes
  useEffect(() => {
    if (!persistKey) return;
    savePersist(persistKey, { mode, targetMs, showSeconds });
  }, [persistKey, mode, targetMs, showSeconds]);

  const [parts, setParts] = useState<TimeParts>(() => splitTime(targetMs - Date.now()));

  useEffect(() => {
    reachedOnceRef.current = false;
    setParts(splitTime(targetMs - Date.now()));
  }, [targetMs]);

  useEffect(() => {
    if (!running) return;

    const tick = () => {
      const diff = targetMs - Date.now();
      const next = splitTime(diff);
      setParts(next);

      if (next.reached) {
        if (!reachedOnceRef.current) {
          reachedOnceRef.current = true;
          onReached?.();
        }
        setRunning(false);
        setPausedRemainingMs(null);
      }
    };

    tick();
    const id = window.setInterval(tick, showSeconds ? 250 : 1000);
    return () => window.clearInterval(id);
  }, [running, targetMs, showSeconds, onReached]);

  const targetLabel = useMemo(() => formatTarget(targetMs, locale), [targetMs, locale]);

  const statusLabel = parts.reached
    ? t("countdown.status.reached")
    : running
      ? t("countdown.status.running")
      : t("countdown.status.paused");

  const pillText = useMemo(() => {
    if (parts.reached) return t("countdown.pill.reached");
    return showSeconds
      ? t("countdown.pill.full", {
          days: parts.days,
          hours: parts.hours,
          mins: parts.mins,
          secs: parts.secs
        })
      : t("countdown.pill.short", {
          days: parts.days,
          hours: parts.hours,
          mins: parts.mins
        });
  }, [parts, showSeconds, t]);

  const handlePauseResume = () => {
    if (parts.reached) return;

    if (running) {
      // pause: freeze remaining
      const remaining = Math.max(0, targetMs - Date.now());
      setPausedRemainingMs(remaining);
      setRunning(false);
    } else {
      // resume: set a new target based on remaining
      const remaining = pausedRemainingMs ?? Math.max(0, targetMs - Date.now());
      setTargetMs(Date.now() + remaining);
      setPausedRemainingMs(null);
      setRunning(true);
    }
  };

  const handleReset = () => {
    const base = originalTargetMsRef.current ?? parseTargetMs(target);
    if (base) {
      setTargetMs(base);
      setRunning(true);
      setPausedRemainingMs(null);
      setMode("datetime");
      return;
    }
    // fallback
    setTargetMs(Date.now() + 30 * 60 * 1000);
    setRunning(true);
    setPausedRemainingMs(null);
    setMode("duration");
  };

  const applyDatetimeTarget = () => {
    const ms = new Date(dateTimeInput).getTime();
    if (!Number.isFinite(ms)) return;
    setTargetMs(ms);
    setMode("datetime");
    setRunning(true);
    setPausedRemainingMs(null);
    setSettingsOpen(false);
  };

  const applyDurationTarget = () => {
    const hh = clamp(Number(durationInput.hh) || 0, 0, 999);
    const mm = clamp(Number(durationInput.mm) || 0, 0, 59);
    const ss = clamp(Number(durationInput.ss) || 0, 0, 59);
    const total = hh * 3600 + mm * 60 + ss;
    if (total <= 0) return;
    setTargetMs(Date.now() + total * 1000);
    setMode("duration");
    setRunning(true);
    setPausedRemainingMs(null);
    setSettingsOpen(false);
  };

  const quickAdd = (sec: number) => {
    setTargetMs((prev) => {
      const now = Date.now();
      const remaining = Math.max(0, prev - now);
      const nextRemaining = remaining + sec * 1000;
      return now + nextRemaining;
    });
    setRunning(true);
    setPausedRemainingMs(null);
  };

  const Column = ({ label, value }: { label: string; value: string }) => (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="absolute inset-0 opacity-70 pointer-events-none"
           style={{
             background:
               "radial-gradient(900px 120px at 50% 0%, rgba(34,197,94,0.14), transparent 60%), radial-gradient(900px 220px at 20% 100%, rgba(59,130,246,0.10), transparent 60%)",
           }}
      />
      <div className="relative px-3 py-3 flex flex-col items-center justify-center">
        <div className="text-[34px] leading-none font-black tracking-tight text-[var(--text-main,#0f172a)] tabular-nums">
          {value}
        </div>
        <div className="mt-1 text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--text-muted,#64748b)]">
          {label}
        </div>
      </div>
    </div>
  );

  const IconButton = ({
    title: t,
    onClick,
    children,
    disabled,
  }: {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      title={t}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
        "border border-white/60 bg-white/70 backdrop-blur shadow-[0_10px_22px_rgba(0,0,0,0.08)]",
        "hover:bg-white/90 hover:-translate-y-[1px] active:translate-y-0",
        "disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-white/70",
      ].join(" ")}
    >
      {children}
    </button>
  );

  if (minimal) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/60 bg-white/70 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.15em]">
          <span
            className={[
              "w-2 h-2 rounded-full",
              parts.reached ? "bg-[var(--primary-color,#16a34a)]" : running ? "bg-[var(--primary-color,#22c55e)] animate-pulse" : "bg-amber-500",
            ].join(" ")}
          />
          <span>{labelText}</span>
        </div>
        <div className="text-base font-extrabold text-[var(--text-main,#0f172a)] tabular-nums">{pillText}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div
        className="relative rounded-[28px] border shadow-[0_18px_55px_rgba(0,0,0,0.10)] px-5 py-4 backdrop-blur overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(240,244,248,0.96))",
          borderColor: "rgba(255,255,255,0.65)",
        }}
      >
        {/* Ambient background */}
        <div
          className="pointer-events-none absolute -top-24 -right-28 h-64 w-64 rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.35), transparent 60%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle at 40% 40%, rgba(59,130,246,0.30), transparent 62%)" }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--text-muted,#64748b)]">
              {labelText}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-[12px] font-semibold text-[var(--text-muted,#64748b)] backdrop-blur">
                <span
                  className={[
                    "w-2 h-2 rounded-full",
                    parts.reached ? "bg-[var(--primary-color,#16a34a)]" : running ? "bg-[var(--primary-color,#22c55e)] animate-pulse" : "bg-amber-500",
                  ].join(" ")}
                />
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="mt-2 text-[18px] font-black text-[var(--text-main,#0f172a)] leading-tight">
              {titleText}
            </div>
            <div className="mt-1 text-[12px] text-[var(--text-muted,#64748b)]">
              {subtitleText}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted,#64748b)]">
              {t("countdown.target_label")}
            </div>
            <div className="text-[12px] font-bold text-[var(--text-main,#0f172a)] tabular-nums">
              {targetLabel}
            </div>

            {editable && (
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="mt-1 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 backdrop-blur shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:bg-white/90 transition"
                title={t("countdown.settings")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.7-1l-.4-2.5H9l-.4 2.5a8 8 0 0 0-1.7 1L4.5 9 2.5 12.5l2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-.7a8 8 0 0 0 1.7 1l.4 2.5h6l.4-2.5a8 8 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{t("countdown.settings")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Timer */}
        {parts.reached ? (
          <div className="relative mt-4 rounded-3xl border border-white/60 bg-white/65 p-5 text-center backdrop-blur">
            <div className="text-[22px] font-black text-[var(--primary-color,#16a34a)]">
              {t("countdown.status.reached")}
            </div>
            <div className="mt-1 text-[12px] text-[var(--text-muted,#64748b)]">
              {t("countdown.reached.desc")}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <IconButton title={t("countdown.action.reset")} onClick={handleReset}>
                <span className="text-[13px]">{t("countdown.action.reset")}</span>
              </IconButton>
              {editable && (
                <IconButton title={t("countdown.action.reconfigure")} onClick={() => setSettingsOpen(true)}>
                  <span className="text-[13px]">{t("countdown.action.reconfigure")}</span>
                </IconButton>
              )}
            </div>
          </div>
        ) : (
          <div className="relative mt-4 grid grid-cols-4 gap-3 text-center">
            <Column label={t("countdown.unit.day")} value={String(parts.days)} />
            <Column label={t("countdown.unit.hour")} value={pad2(parts.hours)} />
            <Column label={t("countdown.unit.minute")} value={pad2(parts.mins)} />
            {showSeconds ? (
              <Column label={t("countdown.unit.second")} value={pad2(parts.secs)} />
            ) : (
              <Column label={t("countdown.unit.second")} value="--" />
            )}
          </div>
        )}

        {/* Controls */}
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <IconButton
            title={running ? t("countdown.action.pause") : t("countdown.action.resume")}
            onClick={handlePauseResume}
            disabled={parts.reached}
          >
            <span className="text-[13px]">
              {running ? t("countdown.action.pause") : t("countdown.action.resume")}
            </span>
          </IconButton>
          <IconButton title={t("countdown.action.reset_original")} onClick={handleReset}>
            <span className="text-[13px]">{t("countdown.action.reset")}</span>
          </IconButton>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 backdrop-blur shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:bg-white/90 transition"
              onClick={() => setShowSeconds((v) => !v)}
              title={t("countdown.action.toggle_seconds")}
            >
              <span className="text-[13px]">
                {showSeconds ? t("countdown.action.hide_seconds") : t("countdown.action.show_seconds")}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => quickAdd(5 * 60)}
                className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 backdrop-blur shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:bg-white/90 transition"
                title={t("countdown.action.add_minutes", { minutes: 5 })}
              >
                +5m
              </button>
              <button
                type="button"
                onClick={() => quickAdd(15 * 60)}
                className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 backdrop-blur shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:bg-white/90 transition"
                title={t("countdown.action.add_minutes", { minutes: 15 })}
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => quickAdd(60 * 60)}
                className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 backdrop-blur shadow-[0_10px_22px_rgba(0,0,0,0.08)] hover:bg-white/90 transition"
                title={t("countdown.action.add_hours", { hours: 1 })}
              >
                +1h
              </button>
            </div>
          </div>
        </div>

        {/* Settings (in-card, no overflow outside) */}
        {editable && settingsOpen && (
          <div className="relative mt-4 rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[var(--text-muted,#64748b)]">
                  {t("countdown.settings.label")}
                </div>
                <div className="mt-1 text-[14px] font-black text-[var(--text-main,#0f172a)]">
                  {t("countdown.settings.title")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 hover:bg-white/90 transition"
              >
                {t("countdown.settings.close")}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Mode switch */}
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
                <div className="text-[12px] font-extrabold text-[var(--text-main,#0f172a)]">
                  {t("countdown.settings.mode")}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("datetime")}
                    className={[
                      "rounded-2xl px-3 py-2 text-sm font-semibold border transition",
                      mode === "datetime"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-white/60 bg-white/70 hover:bg-white/90",
                    ].join(" ")}
                  >
                    {t("countdown.settings.mode_datetime")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("duration")}
                    className={[
                      "rounded-2xl px-3 py-2 text-sm font-semibold border transition",
                      mode === "duration"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-white/60 bg-white/70 hover:bg-white/90",
                    ].join(" ")}
                  >
                    {t("countdown.settings.mode_duration")}
                  </button>
                </div>
                <div className="mt-2 text-[12px] text-[var(--text-muted,#64748b)]">
                  {t("countdown.settings.mode_help")}
                </div>
              </div>

              {/* Quick presets */}
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
                <div className="text-[12px] font-extrabold text-[var(--text-main,#0f172a)]">
                  {t("countdown.settings.quick")}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { t: t("countdown.quick.5m"), s: 5 * 60 },
                    { t: t("countdown.quick.15m"), s: 15 * 60 },
                    { t: t("countdown.quick.30m"), s: 30 * 60 },
                    { t: t("countdown.quick.1h"), s: 60 * 60 },
                    { t: t("countdown.quick.2h"), s: 2 * 60 * 60 },
                    { t: t("countdown.quick.1d"), s: 24 * 60 * 60 },
                  ].map((p) => (
                    <button
                      key={p.t}
                      type="button"
                      onClick={() => {
                        setTargetMs(Date.now() + p.s * 1000);
                        setMode("duration");
                        setRunning(true);
                        setPausedRemainingMs(null);
                        setSettingsOpen(false);
                      }}
                      className="rounded-2xl px-3 py-2 text-sm font-semibold border border-white/60 bg-white/70 hover:bg-white/90 transition"
                    >
                      {p.t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datetime */}
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] font-extrabold text-[var(--text-main,#0f172a)]">
                    {t("countdown.settings.mode_datetime")}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted,#64748b)] tabular-nums">
                    {formatTarget(new Date(dateTimeInput).getTime(), locale)}
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={dateTimeInput}
                    onChange={(e) => setDateTimeInput(e.target.value)}
                    className="w-full rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--text-main,#0f172a)] outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyDatetimeTarget}
                  className="mt-3 w-full rounded-2xl px-3 py-2 text-sm font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
                >
                  {t("countdown.settings.apply_datetime")}
                </button>
                <div className="mt-2 text-[12px] text-[var(--text-muted,#64748b)]">
                  {t("countdown.settings.datetime_hint")}
                </div>
              </div>

              {/* Duration */}
              <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
                <div className="text-[12px] font-extrabold text-[var(--text-main,#0f172a)]">
                  {t("countdown.settings.mode_duration")}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-3 py-2">
                    <div className="text-[11px] font-semibold text-[var(--text-muted,#64748b)]">
                      {t("countdown.unit.hour")}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={durationInput.hh}
                      onChange={(e) => setDurationInput((p) => ({ ...p, hh: Number(e.target.value) }))}
                      className="mt-1 w-full bg-transparent outline-none text-sm font-black text-[var(--text-main,#0f172a)]"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-3 py-2">
                    <div className="text-[11px] font-semibold text-[var(--text-muted,#64748b)]">
                      {t("countdown.unit.minute")}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={durationInput.mm}
                      onChange={(e) => setDurationInput((p) => ({ ...p, mm: Number(e.target.value) }))}
                      className="mt-1 w-full bg-transparent outline-none text-sm font-black text-[var(--text-main,#0f172a)]"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/80 px-3 py-2">
                    <div className="text-[11px] font-semibold text-[var(--text-muted,#64748b)]">
                      {t("countdown.unit.second")}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={durationInput.ss}
                      onChange={(e) => setDurationInput((p) => ({ ...p, ss: Number(e.target.value) }))}
                      className="mt-1 w-full bg-transparent outline-none text-sm font-black text-[var(--text-main,#0f172a)]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyDurationTarget}
                  className="mt-3 w-full rounded-2xl px-3 py-2 text-sm font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
                >
                  {t("countdown.action.start")}
                </button>
                <div className="mt-2 text-[12px] text-[var(--text-muted,#64748b)]">
                  {t("countdown.settings.duration_hint")}
                </div>
              </div>
            </div>

            {/* Persist helper */}
            {persistKey && (
              <div className="mt-3 text-[12px] text-[var(--text-muted,#64748b)]">
                {t("countdown.settings.persist")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};



