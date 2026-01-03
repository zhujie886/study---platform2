import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect(userId: string) {
    if (this.socket?.connected) {
        if (this.userId === userId) return;
        // 相同用户，无需重连
        this.disconnect();
    }

    this.userId = userId;
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { userId } // 发送认证信息
      });

      this.socket.on('connect', () => {
        console.log('[socket] connected');
        this.socket?.emit('join', userId);
        // Re-register all listeners on successful connection
        this.listeners.forEach((callbacks, event) => {
          callbacks.forEach(callback => this.socket?.on(event, callback));
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[socket] disconnected:', reason);
      });

      this.socket.on('reconnect', () => {
        console.log('[socket] reconnected');
        this.socket?.emit('join', this.userId);
      });

    } catch (error) {
      console.error('Socket init failed:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave', this.userId);
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      const callbacks = this.listeners.get(event)?.filter(cb => cb !== callback);
      this.listeners.set(event, callbacks || []);
    } else {
      this.listeners.delete(event);
    }
    this.socket?.off(event, callback);
  }

  // FIXME: AI代码生成未完成 保留原有特定方法，建议逐步迁移使用通用的 on/off
  onMemoCreated(cb: any) { this.on('memo:created', cb); }
  onMemoUpdated(cb: any) { this.on('memo:updated', cb); }
  onMemoDeleted(cb: any) { this.on('memo:deleted', cb); }
  onCalendarCreated(cb: any) { this.on('calendar:created', cb); }
  onCalendarUpdated(cb: any) { this.on('calendar:updated', cb); }
  onCalendarDeleted(cb: any) { this.on('calendar:deleted', cb); }
  onTimelineUpdated(cb: any) { this.on('timeline:updated', cb); }
  onNotification(cb: any) { this.on('notification:received', cb); }

  removeAllListeners() {
    this.socket?.removeAllListeners();
    this.listeners.clear();
  }
}

export const socketService = new SocketService();


