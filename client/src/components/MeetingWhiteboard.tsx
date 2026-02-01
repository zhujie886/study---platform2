import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { whiteboardAPI } from '@/services/api';
import { useLanguage } from '@/i18n/LanguageContext';

type Point = { x: number; y: number };
type Stroke = {
  points: Point[];
  color: string;
  size: number;
  mode: 'draw' | 'erase';
};

type WhiteboardAction = {
  id: string;
  actionType: string;
  actionData: any;
  createdAt?: string;
};

type Props = {
  roomId: string;
};

const COLORS = ['#111827', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
const BACKGROUND = '#ffffff';

function parseActionData(data: any) {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data;
}

export default function MeetingWhiteboard({ roomId }: Props) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<WhiteboardAction[]>([]);
  const drawingRef = useRef<{ active: boolean; points: Point[] }>({ active: false, points: [] });
  const isDrawingRef = useRef(false);
  const dprRef = useRef(1);

  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
    ctx.restore();
  };

  const drawStroke = (stroke: Stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { points } = stroke;
    if (!points || points.length === 0) return;

    ctx.save();
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;
    if (stroke.mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
    }

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    ctx.restore();
  };

  const renderActions = (actions: WhiteboardAction[]) => {
    resetCanvas();
    actions.forEach((action) => {
      if (action.actionType === 'clear') {
        resetCanvas();
        return;
      }
      if (action.actionType === 'stroke') {
        const data = parseActionData(action.actionData) as Stroke | null;
        if (data && Array.isArray(data.points)) drawStroke(data);
      }
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    const rect = frame.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderActions(actionsRef.current);
  };

  const loadWhiteboard = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      setError('');
      const listRes = await whiteboardAPI.listByRoom(roomId);
      const existing = Array.isArray(listRes.data) ? listRes.data[0] : null;
      if (existing?.id) {
        setWhiteboardId(existing.id);
        return;
      }
      const created = await whiteboardAPI.create({ roomId });
      if (created.data?.id) {
        setWhiteboardId(created.data.id);
      }
    } catch (err) {
      console.error(t('whiteboard.load_failed'), err);
      setError(t('whiteboard.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadActions = async () => {
    if (!whiteboardId || isDrawingRef.current) return;
    try {
      const response = await whiteboardAPI.listActions(whiteboardId);
      const actions = Array.isArray(response.data) ? response.data : [];
      const parsed = actions.map((item: any) => ({
        ...item,
        actionData: parseActionData(item.actionData)
      }));
      actionsRef.current = parsed;
      renderActions(parsed);
    } catch (err) {
      console.error(t('whiteboard.sync_failed'), err);
    }
  };

  useEffect(() => {
    loadWhiteboard();
  }, [roomId]);

  useEffect(() => {
    if (!whiteboardId) return;
    loadActions();
    const timer = setInterval(loadActions, 2000);
    return () => clearInterval(timer);
  }, [whiteboardId]);

  useEffect(() => {
    resizeCanvas();
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (frameRef.current) observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  const getPointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!whiteboardId) return;
    const point = getPointFromEvent(event);
    drawingRef.current = { active: true, points: [point] };
    isDrawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawStroke({
      points: [point],
      color,
      size: brushSize,
      mode
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return;
    const point = getPointFromEvent(event);
    const points = drawingRef.current.points;
    points.push(point);
    drawingRef.current.points = points;
    if (points.length >= 2) {
      drawStroke({
        points: points.slice(-2),
        color,
        size: brushSize,
        mode
      });
    }
  };

  const handlePointerUp = async (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active || !whiteboardId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const stroke: Stroke = {
      points: drawingRef.current.points,
      color,
      size: brushSize,
      mode
    };
    drawingRef.current = { active: false, points: [] };
    isDrawingRef.current = false;
    try {
      await whiteboardAPI.addAction(whiteboardId, {
        actionType: 'stroke',
        actionData: stroke
      });
      actionsRef.current = [...actionsRef.current, { id: `${Date.now()}`, actionType: 'stroke', actionData: stroke }];
    } catch (err) {
      toast.error(t('whiteboard.sync_failed'));
    }
  };

  const handleClear = async () => {
    if (!whiteboardId) return;
    try {
      await whiteboardAPI.clear(whiteboardId);
      await loadActions();
      toast.success(t('whiteboard.cleared'));
    } catch (err) {
      toast.error(t('whiteboard.clear_failed'));
    }
  };

  return (
    <div className="h-full w-full rounded-2xl border border-gray-700 bg-gray-900/70 backdrop-blur p-4 flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{t('whiteboard.title')}</div>
          <div className="text-xs text-gray-400">{t('whiteboard.subtitle')}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 text-xs rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700"
          >
            {t('whiteboard.clear')}
          </button>
          <button
            type="button"
            onClick={loadActions}
            className="px-3 py-1.5 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
          >
            {t('whiteboard.sync')}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          {COLORS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setColor(item)}
              className={`h-6 w-6 rounded-full border ${color === item ? 'border-white' : 'border-transparent'}`}
              style={{ backgroundColor: item }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span>{t('whiteboard.brush')}</span>
          <input
            type="range"
            min={2}
            max={18}
            value={brushSize}
            onChange={(event) => setBrushSize(Number(event.target.value))}
            className="accent-indigo-500"
          />
          <span>{brushSize}px</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-3 py-1 rounded-full ${mode === 'draw' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            {t('whiteboard.draw')}
          </button>
          <button
            type="button"
            onClick={() => setMode('erase')}
            className={`px-3 py-1 rounded-full ${mode === 'erase' ? 'bg-rose-500 text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            {t('whiteboard.erase')}
          </button>
        </div>
      </div>

      {loading && <div className="mt-3 text-xs text-gray-400">{t('whiteboard.loading')}</div>}
      {error && <div className="mt-3 text-xs text-rose-400">{error}</div>}

      <div ref={frameRef} className="mt-3 flex-1 rounded-xl overflow-hidden border border-gray-200 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
    </div>
  );
}