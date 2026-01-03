// @ts-nocheck
import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { webrtcClient } from '@/services/webrtc';
import { videoAPI } from '@/services/api';

type WaitingUser = { userId: string; socketId?: string };

const WebARCanvas = lazy(() =>
  import('@/components/WebARCanvas')
    .then((m) => m)
    .catch(() => ({
      default: () => (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
          Mok 视觉模块未就绪：请先安装依赖 @react-three/fiber @react-three/drei three @mediapipe/tasks-vision
        </div>
      ),
    }))
);

export default function NextGenVideoRoomPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuthStore();

  const localRef = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ userId: string; stream: MediaStream }[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [room, setRoom] = useState<any>(null);

  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [showMok, setShowMok] = useState(true);

  // Waiting room UX
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);

  const isHost = useMemo(() => {
    if (!room || !user) return false;
    return room.hostId === user.id;
  }, [room, user]);

  useEffect(() => {
    const handler = (e: any) => {
      const { userId, stream } = e.detail || {};
      if (!userId || !stream) return;
      setRemoteStreams((prev) => {
        const exists = prev.find((x) => x.userId === userId);
        if (exists) return prev.map((x) => (x.userId === userId ? { userId, stream } : x));
        return [...prev, { userId, stream }];
      });
    };
    window.addEventListener('webrtc:remote-stream', handler as any);
    return () => window.removeEventListener('webrtc:remote-stream', handler as any);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    let localStream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        // Load room metadata (hostId / enableWaitingRoom etc.)
        const roomResp = await videoAPI.getRoom(id);
        if (cancelled) return;
        setRoom(roomResp.data);

        const joinResp = await videoAPI.joinRoom(id);
        const roomToken = joinResp?.data?.token as string | undefined;
        if (!roomToken) {
          toast.error('进入会议失败：缺少房间凭证');
          return;
        }

        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) return;

        if (localRef.current) localRef.current.srcObject = localStream;

        await webrtcClient.init(id, user.id, localStream, {
          onExistingUsers: (users) => setParticipants(users.map((u) => u.userId)),
          onUserJoined: (uid) => setParticipants((prev) => Array.from(new Set([...prev, uid]))),
          onUserLeft: (uid) => setParticipants((prev) => prev.filter((p) => p !== uid)),
          onWaitingRoom: () => setIsWaiting(true),
          onAdmitted: () => {
            setIsWaiting(false);
            toast.success('已进入会议');
          },
          onWaitingUser: (payload) => {
            setWaitingUsers((prev) => {
              const next = prev.filter((x) => x.userId !== payload.userId);
              return [...next, payload];
            });
          },
          onWaitingUserLeft: (payload) => setWaitingUsers((prev) => prev.filter((x) => x.userId !== payload.userId)),
          onHostMuteAll: () => {
            webrtcClient.toggleAudio(false);
            setAudioMuted(true);
            toast('主持人已将你静音');
          }
        }, { roomToken });
      } catch (e: any) {
        toast.error(e?.message || '无法进入会议');
      }
    })();

    return () => {
      cancelled = true;
      try { webrtcClient.dispose(); } catch {}
      try { localStream?.getTracks().forEach((t) => t.stop()); } catch {}
      setRemoteStreams([]);
      setParticipants([]);
      setWaitingUsers([]);
      setIsWaiting(false);
    };
  }, [id, user?.id]);

  const toggleAudio = () => {
    const next = !audioMuted;
    webrtcClient.toggleAudio(!next);
    setAudioMuted(next);
  };

  const toggleVideo = () => {
    const next = !videoOff;
    webrtcClient.toggleVideo(!next);
    setVideoOff(next);
  };

  const startShare = async () => {
    try {
      await webrtcClient.startScreenShare();
      setSharing(true);
      toast.success('开始共享屏幕');
    } catch (e: any) {
      toast.error(e?.message || '无法共享屏幕');
    }
  };

  const stopShare = () => {
    try {
      webrtcClient.stopScreenShare();
      setSharing(false);
      toast.success('已停止共享屏幕');
    } catch {}
  };

  const leave = () => {
    if (confirm('确定要离开会议吗？')) nav('/video');
  };

  const admit = (uid: string) => {
    if (!id) return;
    webrtcClient.admitUser(id, uid);
    setWaitingUsers((prev) => prev.filter((x) => x.userId !== uid));
  };

  const muteAll = () => {
    if (!id) return;
    webrtcClient.hostMuteAll(id);
    toast('已发送全员静音指令');
  };

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-xl font-semibold">会议房间</div>
          <div className="text-sm text-gray-600 break-all">{id}</div>
          <div className="text-xs text-gray-500 mt-1">
            参会者（除我）：{participants.join(', ') || '—'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" onClick={() => setShowMok((v) => !v)}>{showMok ? '关闭 Mok' : '开启 Mok'}</button>
          <button className="btn" onClick={toggleAudio}>{audioMuted ? '开启麦克风' : '静音'}</button>
          <button className="btn" onClick={toggleVideo}>{videoOff ? '打开摄像头' : '关闭摄像头'}</button>
          {!sharing ? (
            <button className="btn" onClick={startShare}>共享屏幕</button>
          ) : (
            <button className="btn" onClick={stopShare}>停止共享</button>
          )}
          {isHost && <button className="btn" onClick={muteAll}>全员静音</button>}
          <button className="btn" onClick={leave}>离开</button>
        </div>
      </div>

      {isWaiting && (
        <div className="p-3 mb-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-900">
          已进入等候室，正在等待主持人批准入会…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded overflow-hidden bg-black relative min-h-[420px]">
          {showMok ? (
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">加载 Mok 特效中…</div>}>
              <WebARCanvas />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/80">
              Mok 面板已关闭
            </div>
          )}
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-sm font-semibold mb-2">视频画面</div>
          <div className="grid grid-cols-2 gap-2">
            <video ref={localRef} autoPlay muted playsInline className="w-full rounded bg-black" />
            {remoteStreams.map((rs) => (
              <video
                key={rs.userId}
                autoPlay
                playsInline
                className="w-full rounded bg-black"
                ref={(el) => { if (el) el.srcObject = rs.stream; }}
              />
            ))}
          </div>

          {isHost && waitingUsers.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">等候室</div>
              <div className="space-y-2">
                {waitingUsers.map((w) => (
                  <div key={w.userId} className="flex items-center justify-between gap-2 p-2 rounded border">
                    <div className="text-xs break-all">{w.userId}</div>
                    <button className="btn" onClick={() => admit(w.userId)}>批准</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            提示：如需传统会议界面，请访问 /video-basic/{id}
          </div>
        </div>
      </div>
    </div>
  );
}
