import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { videoAPI } from '@/services/api';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

export default function VideoLobbyPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('快速会议');
  const [roomIdOrLink, setRoomIdOrLink] = useState('');

  const normalizedRoomId = useMemo(() => {
    const v = roomIdOrLink.trim();
    if (!v) return '';
    try {
      if (v.startsWith('http')) {
        const u = new URL(v);
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts.indexOf('video');
        if (i >= 0 && parts[i + 1]) return parts[i + 1];
      }
    } catch {}
    return v;
  }, [roomIdOrLink]);

  const createAndEnter = async () => {
    setCreating(true);
    try {
      const res = await videoAPI.createRoom({ title: title.trim() || '快速会议' });
      const room = res.data;
      const id = room?.id || room?.roomId;
      if (id) {
        toast.success('会议已创建');
        navigate(`/video/${id}`);
      }
    } catch (e: any) {
      toast.error('创建会议失败');
    } finally {
      setCreating(false);
    }
  };

  const join = () => {
    if (!normalizedRoomId) {
      toast.error('请输入会议ID');
      return;
    }
    navigate(`/video/${normalizedRoomId}`);
  };

  const openInNewWindow = () => {
    if (!normalizedRoomId) {
        toast.error('请先输入会议ID');
        return;
    }
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
        `/video/${normalizedRoomId}`, 
        'MeetingWindow', 
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no,status=no`
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📹 视频会议大厅</h1>
        <p className="text-gray-500 mb-8">极速、稳定、安全的实时视频通讯</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 创建会议 */}
          <div className="border-2 border-dashed border-primary-100 rounded-xl p-6 bg-primary-50">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">创建新会议</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500"
              placeholder="会议主题"
            />

            <button
              onClick={createAndEnter}
              disabled={creating}
              className="w-full py-3 rounded-lg font-medium transition shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--primary-color, #e11d48), var(--secondary-color, #f472b6))',
                color: '#fff'
              }}
            >
              {creating ? '正在创建...' : '立即发起会议'}
            </button>
          </div>

          {/* 加入会议 */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">加入会议</h2>
            <input
              value={roomIdOrLink}
              onChange={(e) => setRoomIdOrLink(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500"
              placeholder="输入会议号或链接"
            />
            <div className="flex gap-3">
              <button
                onClick={join}
                className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition"
              >
                进入房间
              </button>
              <button
                onClick={openInNewWindow}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                title="在新窗口打开 (推荐)"
              >
                <ArrowsPointingOutIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
