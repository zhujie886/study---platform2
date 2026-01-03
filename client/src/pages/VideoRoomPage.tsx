import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, 
  FileText, Circle, Hand, Download, MonitorUp, Share2, 
  Smile, Maximize, Minimize, PictureInPicture, X, Send,
  PenTool,
  Info, Copy 
} from 'lucide-react';
import MeetingWhiteboard from '@/components/MeetingWhiteboard';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VideoRoomPage() {
  // ================= 1. 核心状态 =================
  const { id } = useParams();
  const roomId = id || '';
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // ================= 2. UI/功能状态 =================
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [messages, setMessages] = useState<{user: string, text: string, time: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{id: number, char: string, left: number}[]>([]);

  // ================= 3. 生命周期 =================
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopAllTracks();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && showChat && inputMessage) sendMessage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChat, inputMessage]);

  // ================= 4. 媒体控制 =================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsScreenSharing(false);
    } catch (err) {
      showToast("❌ 无法获取摄像头权限");
      console.error(err);
    }
  };

  const stopAllTracks = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopAllTracks();
      await startCamera();
    } else {
      try {
        // @ts-ignore
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => startCamera();
      } catch (err) {
        showToast("已取消屏幕共享");
      }
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (localVideoRef.current) await localVideoRef.current.requestPictureInPicture();
    } catch (error) { showToast("⚠️ 不支持画中画"); }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ================= 5. 功能逻辑 =================
  // 字幕
  useEffect(() => {
    if (isCaptionsEnabled) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showToast("⚠️ 浏览器不支持语音识别");
        setIsCaptionsEnabled(false);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        setCaptionText(lastResult[0].transcript);
        if (lastResult.isFinal) setTimeout(() => setCaptionText(''), 6000);
      };
      try { recognition.start(); recognitionRef.current = recognition; } catch (e) {}
    } else {
      if (recognitionRef.current) recognitionRef.current.stop();
      setCaptionText('');
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [isCaptionsEnabled]);

  // 录制
  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      showToast("💾 录制已保存");
    } else {
      if (!mediaStreamRef.current) return;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(mediaStreamRef.current);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Meeting-${Date.now()}.webm`;
        a.click();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      showToast("🔴 正在录制...");
    }
  };

  // 聊天与互动
  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg = {
      user: user?.username || '我',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setMessages([...messages, newMsg]);
    setInputMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, {user: '助手', text: '收到: ' + newMsg.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    }, 1000);
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, char: emoji, left: Math.random() * 80 + 10 }]);
    setShowReactions(false);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!user) return <div className="h-screen w-full bg-gray-900 flex items-center justify-center text-white">加载中...</div>;

  return (
    // 外层容器：使用 h-screen 和 overflow-hidden 确保不出现滚动条
    <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden relative">

      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] bg-indigo-600 px-6 py-2 rounded-full shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 表情层 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {floatingEmojis.map(emoji => (
          <div key={emoji.id} className="absolute bottom-0 text-4xl" style={{ left: `${emoji.left}%`, animation: 'floatUp 2s ease-out forwards' }}>
            {emoji.char}
          </div>
        ))}
      </div>

      {/* ★★★★★ 核心修复：新增会议信息弹窗 ★★★★★ */}
      {showInfo && <MeetingInfoModal roomId={roomId} onClose={() => setShowInfo(false)} showToast={showToast} />}

      {/* --- 主内容区域 (左侧) --- */}
      {/* 使用 flex flex-col 确保垂直布局，flex-1 占据剩余空间 */}
      <div className={`flex flex-col flex-1 h-full relative transition-all duration-300 ${showChat ? 'mr-80' : 'mr-0'}`}>

        {/* 顶部悬浮信息 */}
        <div className="absolute top-4 left-4 z-20 flex gap-3">
           <div className="bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur border border-white/10 flex items-center gap-2">
             <span className="font-mono font-bold text-indigo-400">{currentTime}</span>
           </div>
        </div>

        {/* 顶部工具 */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button onClick={togglePiP} className="p-2 bg-black/40 rounded-lg hover:bg-white/10"><PictureInPicture size={18} /></button>
          <button onClick={toggleFullscreen} className="p-2 bg-black/40 rounded-lg hover:bg-white/10">{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
          <button onClick={() => {navigator.clipboard.writeText(window.location.href); showToast("链接已复制")}} className="p-2 bg-indigo-600 rounded-lg shadow-lg"><Share2 size={18} /></button>
        </div>

        {/* --- 视频区域 (中间) --- */}
        {/* 关键：flex-1 和 min-h-0 允许它缩放，overflow-hidden 防止撑大父容器 */}
        <div className="flex-1 min-h-0 w-full relative bg-gray-800 p-4">
          <div className={`h-full w-full flex flex-col gap-4 ${showWhiteboard ? 'lg:flex-row' : ''}`}>
            {showWhiteboard && (
              <div className="w-full lg:w-[42%] h-[36vh] lg:h-full">
                <MeetingWhiteboard roomId={roomId} />
              </div>
            )}
            <div className="flex-1 min-h-0 relative bg-gray-900/40 rounded-2xl p-3 flex items-center justify-center">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`max-w-full max-h-full object-contain shadow-2xl rounded-xl ${!isScreenSharing && !isVideoOff ? 'scale-x-[-1]' : ''} ${isVideoOff ? 'hidden' : ''}`} 
              />

              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold">{user.username?.[0]?.toUpperCase()}</div>
                </div>
              )}

              {isHandRaised && (
                <div className="absolute top-8 right-8 bg-yellow-400 text-black p-4 rounded-full shadow-lg animate-bounce z-30"><Hand size={32} /></div>
              )}

              {isCaptionsEnabled && captionText && (
                <div className="absolute bottom-8 left-0 right-0 text-center z-30 pointer-events-none">
                    <span className="bg-black/70 px-6 py-2 rounded-xl text-lg">{captionText}</span>
                </div>
              )}

              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-sm font-medium">{user.username} (我)</div>
            </div>
          </div>
        </div>

        {/* --- 底部控制栏 (固定) --- */}
        {/* 关键：h-20 固定高度，flex-shrink-0 禁止被挤压，z-50 确保在最上层 */}
        <div className="h-20 flex-shrink-0 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-3 px-4 z-50 select-none">
          <ControlButton active={isMuted} onClick={() => setIsMuted(!isMuted)} onIcon={<MicOff />} offIcon={<Mic />} label="静音" color="red" />
          <ControlButton active={isVideoOff} onClick={() => setIsVideoOff(!isVideoOff)} onIcon={<VideoOff />} offIcon={<Video />} label="视频" color="red" />
          <div className="w-px h-8 bg-gray-700 mx-2"></div>
          <ControlButton active={isScreenSharing} onClick={toggleScreenShare} onIcon={<MonitorUp />} offIcon={<MonitorUp />} label="共享" color="green" />
          <ControlButton active={showWhiteboard} onClick={() => setShowWhiteboard(!showWhiteboard)} onIcon={<PenTool />} offIcon={<PenTool />} label="白板" color="indigo" />
          <ControlButton active={isRecording} onClick={toggleRecording} onIcon={<Download />} offIcon={<Circle className="fill-current" />} label="录制" color="red" />
          <ControlButton active={isCaptionsEnabled} onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)} onIcon={<FileText />} offIcon={<FileText />} label="字幕" color="indigo" />
          <div className="w-px h-8 bg-gray-700 mx-2"></div>

          <div className="relative">
             <ControlButton active={showReactions} onClick={() => setShowReactions(!showReactions)} onIcon={<Smile />} offIcon={<Smile />} label="反应" color="yellow" />
             {showReactions && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 p-2 rounded-xl flex gap-2 border border-gray-700 animate-fade-in-up">
                 {['❤️','👍','😂','🎉'].map(e => <button key={e} onClick={() => sendReaction(e)} className="text-2xl hover:scale-125 p-1">{e}</button>)}
               </div>
             )}
          </div>

          <ControlButton active={isHandRaised} onClick={() => { setIsHandRaised(!isHandRaised); if(!isHandRaised) showToast("🤚 已举手"); }} onIcon={<Hand />} offIcon={<Hand />} label="举手" color="yellow" />
          <ControlButton active={showInfo} onClick={() => setShowInfo(!showInfo)} onIcon={<Info className="fill-current" />} offIcon={<Info />} label="信息" color="indigo" /> {/* ★★★★★ 核心修复：新增信息按钮 */}
          <div className="w-px h-8 bg-gray-700 mx-2"></div>
          <ControlButton active={showChat} onClick={() => setShowChat(!showChat)} onIcon={<MessageSquare className="fill-current" />} offIcon={<MessageSquare />} label="聊天" color="indigo" />

          <button onClick={() => navigate('/booking')} className="ml-4 p-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:scale-105 transition-all">
            <PhoneOff size={22} />
          </button>
        </div>
      </div>

      {/* --- 右侧聊天栏 (固定定位) --- */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-gray-800 border-l border-gray-700 shadow-2xl z-[55] transition-transform duration-300 ${showChat ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
            <h3 className="font-semibold flex items-center gap-2">聊天室</h3>
            <button onClick={() => setShowChat(false)}><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.user.includes('我') ? 'items-end' : 'items-start'}`}>
                 <span className="text-xs text-gray-400 mb-1">{msg.user} {msg.time}</span>
                 <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${msg.user.includes('我') ? 'bg-indigo-600 text-white' : 'bg-gray-700'}`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex gap-2">
            <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="输入消息..." className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-sm text-white outline-none" />
            <button onClick={sendMessage} className="p-2 bg-indigo-600 rounded-full text-white"><Send size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-80vh); opacity: 0; } }
        .animate-fade-in-up { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function ControlButton({ active, onClick, onIcon, offIcon, label, color }: any) {
  const getBg = () => {
    if (active) {
       if (color === 'red') return 'bg-red-500 text-white';
       if (color === 'green') return 'bg-green-500 text-white';
       if (color === 'yellow') return 'bg-yellow-500 text-black';
       if (color === 'indigo') return 'bg-indigo-500 text-white';
    }
    return 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white';
  };
  return (
    <div className="flex flex-col items-center gap-1 group">
      <button onClick={onClick} className={`p-3 rounded-2xl transition-all active:scale-95 ${getBg()}`}>
        {active ? onIcon : offIcon}
      </button>
      <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 pointer-events-none">{label}</span>
    </div>
  );
}

// ★★★★★ 核心修复：新增会议信息弹窗组件 ★★★★★
function MeetingInfoModal({ roomId, onClose, showToast }: { roomId: string, onClose: () => void, showToast: (msg: string) => void }) {
  const meetingLink = window.location.href;
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${type}已复制`);
  };
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-fade-in-up">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold text-lg">会议信息</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400">会议链接</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="text" readOnly value={meetingLink} className="flex-1 bg-gray-900 rounded-lg px-3 py-2 text-sm border border-gray-700" />
              <button onClick={() => copyToClipboard(meetingLink, '链接')} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"><Copy size={16} /></button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400">会议号</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="text" readOnly value={roomId} className="flex-1 bg-gray-900 rounded-lg px-3 py-2 text-sm border border-gray-700" />
              <button onClick={() => copyToClipboard(roomId, '会议号')} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500"><Copy size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
