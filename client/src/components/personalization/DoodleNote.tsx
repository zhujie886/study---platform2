import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";

import toast from "react-hot-toast";

import axios from "axios";
import { useLanguage } from '@/i18n/LanguageContext';

import { PaperAirplaneIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";



type SendPayload = {

  imageBlob: Blob;

  imageDataUrl: string;

  to?: string;

  message?: string;

};



export type DoodleNoteProps = {

  onClose?: () => void;



  /**

   * Optional recipient identifier. If your backend expects a different field name,

   * use `sendDoodle` to customize the request.

   */

  recipientId?: string;



  /**

   * Optional message text that travels with the doodle.

   */

  defaultMessage?: string;



  /**

   * Backend endpoint for sending the doodle. Defaults to `/api/social/doodle`.

   * If you already have a working endpoint, pass it in from the parent.

   */

  endpoint?: string;



  /**

   * If provided, this function will be used instead of the built-in axios request.

   * Recommended to ensure “real send” in any project.

   */

  sendDoodle?: (payload: SendPayload) => Promise<void>;



  /**

   * Called after a successful send (before onClose).

   */

  onSent?: () => void;



  /**

   * Max undo steps stored in memory.

   */

  maxHistory?: number;

};



const PAPER_BG = "#fffbeb";



function dataUrlToBlob(dataUrl: string): Blob {

  const [meta, b64] = dataUrl.split(",");

  const contentType = meta?.match(/data:(.*);base64/)?.[1] || "image/png";

  const bytes = atob(b64);

  const buf = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i += 1) buf[i] = bytes.charCodeAt(i);

  return new Blob([buf], { type: contentType });

}



async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<{ blob: Blob; dataUrl: string }> {

  const dataUrl = canvas.toDataURL("image/png");

  const blob =

    (await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))) ||

    dataUrlToBlob(dataUrl);

  return { blob, dataUrl };

}



function getCanvasCssSize(canvas: HTMLCanvasElement): { w: number; h: number } {

  const r = canvas.getBoundingClientRect();

  return { w: Math.max(1, r.width), h: Math.max(1, r.height) };

}



function prepareCanvas(canvas: HTMLCanvasElement, opts: { brushSize: number; background: string }) {

  const ctx = canvas.getContext("2d");

  if (!ctx) return;



  const dpr = window.devicePixelRatio || 1;

  const { w, h } = getCanvasCssSize(canvas);

  const newW = Math.max(1, Math.round(w * dpr));

  const newH = Math.max(1, Math.round(h * dpr));



  if (canvas.width !== newW) canvas.width = newW;

  if (canvas.height !== newH) canvas.height = newH;



  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.lineCap = "round";

  ctx.lineJoin = "round";

  ctx.lineWidth = opts.brushSize;



  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = opts.background;

  ctx.fillRect(0, 0, w, h);

}



async function drawDataUrlToCanvas(canvas: HTMLCanvasElement, dataUrl: string, bg = PAPER_BG): Promise<void> {

  const ctx = canvas.getContext("2d");

  if (!ctx) return;



  const dpr = window.devicePixelRatio || 1;

  const { w, h } = getCanvasCssSize(canvas);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);



  await new Promise<void>((resolve, reject) => {

    const img = new Image();

    img.onload = () => {

      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = bg;

      ctx.fillRect(0, 0, w, h);

      ctx.drawImage(img, 0, 0, w, h);

      resolve();

    };

    img.onerror = () => reject(new Error("Failed to load snapshot image"));

    img.src = dataUrl;

  });

}



export const DoodleNote = ({

  onClose,

  recipientId,

  defaultMessage = "",

  endpoint = "/api/social/doodle",

  sendDoodle,

  onSent,

  maxHistory = 20,

}: DoodleNoteProps) => {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasFrameRef = useRef<HTMLDivElement>(null);



  // Drawing state

  const [isDrawing, setIsDrawing] = useState(false);

  const isDrawingRef = useRef(false);



  const [mode, setMode] = useState<"pen" | "eraser">("pen");

  const [color, setColor] = useState("#111827");

  const [brushSize, setBrushSize] = useState(4);

  const [hasInk, setHasInk] = useState(false);

  const hasInkRef = useRef(false);



  // Message

  const [message, setMessage] = useState(defaultMessage);



  // Send state

  const [isSending, setIsSending] = useState(false);



  // Undo/Redo snapshots (dataURL)

  const undoStackRef = useRef<string[]>([]);

  const redoStackRef = useRef<string[]>([]);



  const canUndo = undoStackRef.current.length > 0;

  const canRedo = redoStackRef.current.length > 0;



  const getPos = (e: React.PointerEvent) => {

    const canvas = canvasRef.current;

    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return { x: e.clientX - rect.left, y: e.clientY - rect.top };

  };



  // IMPORTANT:

  // Only block drag on POINTERDOWN / POINTERMOVE.

  // Do NOT block POINTERUP, otherwise a parent "draggable window" may never receive mouseup

  // and will keep dragging ("松手后还在硬拖").

  const blockDragDownMove = (e: React.SyntheticEvent) => {

    e.stopPropagation();

    const ne: any = (e as any).nativeEvent;

    if (ne?.stopImmediatePropagation) ne.stopImmediatePropagation();

    if (ne?.preventDefault) ne.preventDefault();

    // also prevent default for React SyntheticEvent

    // @ts-ignore

    if (typeof (e as any).preventDefault === "function") (e as any).preventDefault();

  };



  const pushUndoSnapshot = useCallback(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const snap = canvas.toDataURL("image/png");

    undoStackRef.current.push(snap);

    if (undoStackRef.current.length > maxHistory) undoStackRef.current.shift();

    redoStackRef.current = [];

  }, [maxHistory]);



  // Responsive canvas sizing (fits the window)

  useEffect(() => {

    const canvas = canvasRef.current;

    const frame = canvasFrameRef.current;

    if (!canvas || !frame) return;



    prepareCanvas(canvas, { brushSize, background: PAPER_BG });

    setHasInk(false);

    hasInkRef.current = false;

    undoStackRef.current = [];

    redoStackRef.current = [];



    const ro = new ResizeObserver(async () => {

      const c = canvasRef.current;

      if (!c) return;



      const before = c.toDataURL("image/png");

      prepareCanvas(c, { brushSize, background: PAPER_BG });



      if (hasInkRef.current) {

        await drawDataUrlToCanvas(c, before, PAPER_BG);

      }

    });



    ro.observe(frame);

    return () => ro.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  useEffect(() => {

    const canvas = canvasRef.current;

    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.lineWidth = brushSize;

  }, [brushSize]);



  useEffect(() => {

    hasInkRef.current = hasInk;

  }, [hasInk]);



  useEffect(() => {

    isDrawingRef.current = isDrawing;

  }, [isDrawing]);



  // Hard safety: if a parent drag system is weird, ensure we always stop drawing.

  useEffect(() => {

    const stopAll = (ev?: PointerEvent) => {

      if (!isDrawingRef.current) return;



      isDrawingRef.current = false;

      setIsDrawing(false);



      const canvas = canvasRef.current;

      if (!canvas) return;



      try {

        if (ev?.pointerId != null) canvas.releasePointerCapture(ev.pointerId);

      } catch {

        // ignore

      }

    };



    window.addEventListener("pointerup", stopAll, true);

    window.addEventListener("pointercancel", stopAll, true);

    window.addEventListener("blur", () => stopAll(undefined), true);



    return () => {

      window.removeEventListener("pointerup", stopAll, true);

      window.removeEventListener("pointercancel", stopAll, true);

      window.removeEventListener("blur", () => stopAll(undefined), true);

    };

  }, []);



  const startDraw = (e: React.PointerEvent) => {

    blockDragDownMove(e);



    const canvas = canvasRef.current;

    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;



    try {

      canvas.setPointerCapture(e.pointerId);

    } catch {

      // ignore

    }



    pushUndoSnapshot();



    isDrawingRef.current = true;

    setIsDrawing(true);



    const { x, y } = getPos(e);



    ctx.beginPath();

    ctx.moveTo(x, y);



    if (mode === "eraser") {

      ctx.globalCompositeOperation = "destination-out";

      ctx.strokeStyle = "rgba(0,0,0,1)";

    } else {

      ctx.globalCompositeOperation = "source-over";

      ctx.strokeStyle = color;

    }

  };



  const draw = (e: React.PointerEvent) => {

    if (!isDrawingRef.current) return;

    blockDragDownMove(e);



    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;



    const { x, y } = getPos(e);

    ctx.lineTo(x, y);

    ctx.stroke();



    setHasInk(true);

  };



  const stopDraw = (e: React.PointerEvent) => {

    // DO NOT stopPropagation here (let parent receive pointerup/mouseup to stop dragging)

    if (!isDrawingRef.current) return;



    isDrawingRef.current = false;

    setIsDrawing(false);



    const canvas = canvasRef.current;

    if (!canvas) return;



    try {

      canvas.releasePointerCapture(e.pointerId);

    } catch {

      // ignore

    }

  };



  const clear = useCallback(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;



    pushUndoSnapshot();

    prepareCanvas(canvas, { brushSize, background: PAPER_BG });



    setHasInk(false);

    toast.success(t("已清空"));

  }, [brushSize, pushUndoSnapshot]);



  const undo = useCallback(async () => {

    const canvas = canvasRef.current;

    if (!canvas) return;



    const current = canvas.toDataURL("image/png");

    const prev = undoStackRef.current.pop();

    if (!prev) return;



    redoStackRef.current.push(current);

    await drawDataUrlToCanvas(canvas, prev, PAPER_BG);



    setHasInk(true);

  }, []);



  const redo = useCallback(async () => {

    const canvas = canvasRef.current;

    if (!canvas) return;



    const current = canvas.toDataURL("image/png");

    const next = redoStackRef.current.pop();

    if (!next) return;



    undoStackRef.current.push(current);

    await drawDataUrlToCanvas(canvas, next, PAPER_BG);



    setHasInk(true);

  }, []);



  // Keyboard shortcuts

  useEffect(() => {

    const onKeyDown = (ev: KeyboardEvent) => {

      const isCmd = ev.metaKey || ev.ctrlKey;



      if (ev.key === "Escape") {

        onClose?.();

        return;

      }



      if (!isCmd) return;



      if (ev.key.toLowerCase() === "z" && !ev.shiftKey) {

        ev.preventDefault();

        undo();

        return;

      }



      if (ev.key.toLowerCase() === "y" || (ev.key.toLowerCase() === "z" && ev.shiftKey)) {

        ev.preventDefault();

        redo();

      }

    };



    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);

  }, [onClose, redo, undo]);



  const palette = useMemo(

    () => ["#111827", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#0ea5e9"],

    []

  );



  const send = async () => {

    const canvas = canvasRef.current;

    if (!canvas) return;



    if (!hasInk && !message.trim()) {

      toast.error(t("先画点内容或写一句话再发送"));

      return;

    }



    setIsSending(true);

    const toastId = toast.loading(t("正在发送…"));



    try {

      const { blob, dataUrl } = await canvasToPngBlob(canvas);



      const payload: SendPayload = {

        imageBlob: blob,

        imageDataUrl: dataUrl,

        to: recipientId,

        message: message.trim() || undefined,

      };



      if (sendDoodle) {

        await sendDoodle(payload);

      } else {

        const form = new FormData();

        form.append("image", payload.imageBlob, `doodle_${Date.now()}.png`);

        if (payload.to) form.append("to", payload.to);

        if (payload.message) form.append("message", payload.message);



        await axios.post(endpoint, form, {

          headers: {

            "Content-Type": "multipart/form-data",

          },

        });

      }



      toast.success(t("已发送"), { id: toastId });

      onSent?.();

      onClose?.();

    } catch (e: any) {

      const msg =

        e?.response?.data?.message ||

        e?.message ||

        t("发送失败（请检查后端接口/鉴权/网络）。");

      toast.error(msg, { id: toastId });

    } finally {

      setIsSending(false);

    }

  };



  return (

    <motion.div

      initial={{ x: "120%", rotate: 5 }}

      animate={{ x: 0, rotate: -1.2 }}

      exit={{ x: "120%", rotate: 10 }}

      transition={{ type: "spring", stiffness: 320, damping: 32 }}

      // Fits viewport. Also: select-none avoids weird “mouse stuck selecting”.

      className="select-none w-[min(380px,calc(100vw-16px))] h-[min(620px,calc(100vh-16px))] bg-[#fffbeb] rounded-xl shadow-2xl border border-yellow-200 flex flex-col overflow-hidden relative"

      style={{ transformOrigin: "bottom right" }}

      role="dialog"

      aria-label={t('小纸条涂鸦')}

    >

      {/* Tape */}

      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-200/50 rotate-1 backdrop-blur-sm shadow-sm z-20" />



      {/* Header */}

      <div className="p-4 pt-7 flex justify-between items-center z-10">

        <div className="flex flex-col">

          <span className="text-yellow-800/60 text-xs font-bold tracking-widest uppercase">{t('来自：你')}</span>

          <span className="text-slate-700 text-sm font-semibold leading-tight">{t('小纸条涂鸦')}</span>

        </div>

        <button

          onPointerDown={blockDragDownMove}

          onClick={onClose}

          className="doodle-cancel-drag text-slate-400 hover:text-slate-700"

          aria-label={t('关闭')}

        >

          \u00D7

        </button>

      </div>



      {/* Message */}

      <div className="px-4 pb-2">

        <input

          value={message}

          onChange={(e) => setMessage(e.target.value)}

          onPointerDown={blockDragDownMove}

          placeholder={t("（可选）写一句话…")}

          className="doodle-cancel-drag w-full rounded-lg border border-yellow-200 bg-white/70 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-200"

        />

      </div>



      {/* Canvas */}

      <div className="px-4 pb-3 flex-1 min-h-0">

        <div ref={canvasFrameRef} className="relative rounded-xl overflow-hidden border border-yellow-200 shadow-sm bg-white h-full">

          <canvas

            ref={canvasRef}

            onPointerDown={startDraw}

            onPointerMove={draw}

            onPointerUp={stopDraw}

            onPointerCancel={stopDraw}

            className="doodle-cancel-drag block w-full h-full"

            style={{ touchAction: "none", cursor: mode === "eraser" ? "cell" : "crosshair" }}

          />

          <div

            className="absolute inset-0 pointer-events-none opacity-10"

            style={{

              backgroundImage:

                "linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)",

              backgroundSize: "20px 20px",

            }}

          />

        </div>

      </div>



      {/* Tools (two rows, always visible) */}

      <div className="px-4 pb-3">

        {/* Row 1: Palette + Mode */}

        <div className="flex items-center gap-2 flex-wrap">

          <div className="flex gap-1.5 bg-white/80 p-1.5 rounded-full border border-yellow-100 shadow-sm">

            {palette.map((c) => (

              <button

                key={c}

                onPointerDown={blockDragDownMove}

                onClick={() => {

                  setMode("pen");

                  setColor(c);

                }}

                className={`doodle-cancel-drag w-5 h-5 rounded-full border border-gray-100 transition-transform ${

                  mode === "pen" && color === c ? "scale-125 ring-2 ring-gray-300 z-10" : "hover:scale-110"

                }`}

                style={{ backgroundColor: c }}

                aria-label={`Color ${c}`}

              />

            ))}

          </div>



          <div className="flex items-center gap-1 bg-white/80 rounded-full border border-yellow-100 shadow-sm px-2 py-1">

            <button

              onPointerDown={blockDragDownMove}

              onClick={() => setMode("pen")}

              className={`doodle-cancel-drag text-xs px-2 py-1 rounded-full transition-colors ${

                mode === "pen" ? "bg-yellow-200 text-slate-800" : "text-slate-500 hover:text-slate-700"

              }`}

            >

              {t('画笔')}

            </button>

            <button

              onPointerDown={blockDragDownMove}

              onClick={() => setMode("eraser")}

              className={`doodle-cancel-drag text-xs px-2 py-1 rounded-full transition-colors ${

                mode === "eraser" ? "bg-yellow-200 text-slate-800" : "text-slate-500 hover:text-slate-700"

              }`}

            >

              {t('橡皮')}

            </button>

          </div>



          <div className="flex-1" />

        </div>



        {/* Row 2: Undo/Redo + Brush */}

        <div className="mt-2 grid grid-cols-2 gap-2">

          <div className="flex gap-2">

            <button

              onPointerDown={blockDragDownMove}

              onClick={undo}

              disabled={!canUndo}

              className="doodle-cancel-drag flex-1 px-2 py-1.5 text-xs rounded-md border border-yellow-100 bg-white/70 text-slate-600 hover:bg-white disabled:opacity-40"

              title={`${t("撤销")} (Ctrl/Cmd+Z)`}

            >

              {t('撤销')}

            </button>

            <button

              onPointerDown={blockDragDownMove}

              onClick={redo}

              disabled={!canRedo}

              className="doodle-cancel-drag flex-1 px-2 py-1.5 text-xs rounded-md border border-yellow-100 bg-white/70 text-slate-600 hover:bg-white disabled:opacity-40"

              title={`${t("重做")} (Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z)`}

            >

              {t('重做')}

            </button>

          </div>



          <div className="flex items-center gap-2">

            <span className="text-xs text-slate-500 w-8">{t("粗细")}</span>

            <input

              type="range"

              min={2}

              max={14}

              value={brushSize}

              onPointerDown={blockDragDownMove}

              onChange={(e) => setBrushSize(Number(e.target.value))}

              className="doodle-cancel-drag w-full"

            />

            <span className="text-xs text-slate-500 w-8 text-right">{brushSize}</span>

          </div>

        </div>

      </div>



      {/* Footer */}

      <div className="mt-auto p-3 flex gap-2 items-center bg-white/50 backdrop-blur border-t border-yellow-100">

        <button

          onPointerDown={blockDragDownMove}

          onClick={clear}

          className="doodle-cancel-drag p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"

          title={t("清空")}

          aria-label={t('清空')}

        >

          <TrashIcon className="w-5 h-5" />

        </button>



        <div className="flex-1" />



        <button

          onPointerDown={blockDragDownMove}

          onClick={send}

          disabled={isSending}

          className="doodle-cancel-drag p-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"

          aria-label={t('发送')}

          title={t("发送")}

        >

          {isSending ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PaperAirplaneIcon className="w-5 h-5" />}

        </button>

      </div>

    </motion.div>

  );

};





