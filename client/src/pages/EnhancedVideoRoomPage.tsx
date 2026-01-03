// @ts-nocheck
/**
 * 增强版视频会议界面 - 集成WebAR
 */
import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  ArrowsPointingOutIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  HandRaisedIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  PhoneXMarkIcon,
  ShareIcon,
  UsersIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

// 懒加载WebAR组件，因为它比较大
const WebARCanvas = lazy(() => import('@/components/WebARCanvas'));

export default function EnhancedVideoRoomPage() {
  const { id } = useParams();
  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'people' | 'whiteboard'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const { token, user } = useAuthStore();

  useEffect(() => {
    fetchRoomInfo();
  }, [id]);

  const fetchRoomInfo = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/video/rooms/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoom(response.data);
    } catch (error) {
      toast.error('加载会议失败');
    }
  };

  const leaveCall = () => {
    if (confirm('确定要离开会议吗？')) {
      window.history.back();
    }
  };

  // 其他UI相关的函数保持不变...
  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), user: user?.username, content: messageInput, timestamp: new Date() }]);
    setMessageInput('');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-gray-800/70 backdrop-blur-sm border-b border-gray-700 px-6 py-3 flex items-center justify-between z-20">
        {/* ... 标题栏内容保持不变 ... */}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* AR 视频画面区 */}
        <div className="flex-1 relative bg-black">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-black text-white">加载AR体验中...</div>}>
            <WebARCanvas />
          </Suspense>

          {/* 参与者视频网格（保持不变） */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto z-10">
            {/* ... 参与者列表保持不变 ... */}
          </div>

          {/* 底部控制栏 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800/70 backdrop-blur-sm border-t border-gray-700 z-20">
            <div className="flex items-center justify-center gap-4 py-4 px-6">
              {/* ... 控制按钮保持不变 ... */}
              <button onClick={toggleMute} className={`p-3 rounded-full transition ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}><MicrophoneIcon className="w-6 h-6 text-white" /></button>
              <button onClick={toggleVideo} className={`p-3 rounded-full transition ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'}`}><VideoCameraIcon className="w-6 h-6 text-white" /></button>
              <button className="p-3 rounded-full bg-gray-700"><ShareIcon className="w-6 h-6 text-white" /></button>
              <button className="p-3 rounded-full bg-gray-700"><HandRaisedIcon className="w-6 h-6 text-white" /></button>
              <div className="w-px h-8 bg-gray-600"></div>
              <button onClick={() => { setShowSidebar(!showSidebar); setSidebarTab('chat'); }} className={`p-3 rounded-full transition ${showSidebar && sidebarTab === 'chat' ? 'bg-blue-600' : 'bg-gray-700'}`}><ChatBubbleLeftIcon className="w-6 h-6 text-white" /></button>
              <button onClick={() => { setShowSidebar(!showSidebar); setSidebarTab('people'); }} className={`p-3 rounded-full transition ${showSidebar && sidebarTab === 'people' ? 'bg-blue-600' : 'bg-gray-700'}`}><UsersIcon className="w-6 h-6 text-white" /></button>
              <button onClick={() => { setShowSidebar(!showSidebar); setSidebarTab('whiteboard'); }} className={`p-3 rounded-full transition ${showSidebar && sidebarTab === 'white-board' ? 'bg-blue-600' : 'bg-gray-700'}`}><PencilSquareIcon className="w-6 h-6 text-white" /></button>
              <div className="w-px h-8 bg-gray-600"></div>
              <button onClick={leaveCall} className="p-3 rounded-full bg-red-600"><PhoneXMarkIcon className="w-6 h-6 text-white" /></button>
            </div>
          </div>
        </div>

        {/* 右侧边栏 (保持不变) */}
        {showSidebar && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col z-20">
            {/* ... 侧边栏内容保持不变 ... */}
          </div>
        )}
      </div>
    </div>
  );
}

