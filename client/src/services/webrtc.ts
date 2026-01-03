import { io, Socket } from 'socket.io-client';
import { Gesture } from './GestureService';

const BASE_WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
const WEBRTC_URL = `${String(BASE_WS_URL).replace(/\/$/, '')}/webrtc`;

export type SignalingCallbacks = {
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
  onExistingUsers?: (users: { userId: string; socketId: string }[]) => void;
  onGesture?: (payload: { userId: string; gesture: Gesture }) => void;
  onCaption?: (payload: { userId: string; text: string }) => void;
  onWaitingRoom?: () => void;
  onAdmitted?: () => void;
  onWaitingUser?: (payload: { userId: string; socketId?: string }) => void;
  onWaitingUserLeft?: (payload: { userId: string }) => void;
  onHostMuteAll?: () => void;
};

export type WebRTCInitOptions = {
  roomToken?: string;
};

export class WebRTCClient {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private pcs: Map<string, RTCPeerConnection> = new Map();
  private callbacks: SignalingCallbacks = {};

  async init(
    roomId: string,
    userId: string,
    stream: MediaStream,
    callbacks: SignalingCallbacks = {},
    options: WebRTCInitOptions = {}
  ) {
    this.roomId = roomId;
    this.userId = userId;
    this.localStream = stream;
    this.callbacks = callbacks;

    this.socket = io(WEBRTC_URL, {
      transports: ['websocket'],
      auth: { token: options.roomToken }
    });

    this.socket.on('connect', () => this.socket?.emit('join-room', { roomId, userId }));

    this.socket.on('existing-users', ({ users }) => {
      this.callbacks.onExistingUsers?.(users);
      users.forEach((u: any) => this.ensurePeer(u.userId));
    });

    this.socket.on('user-joined', ({ userId: otherId }) => {
      this.ensurePeer(otherId);
      this.callbacks.onUserJoined?.(otherId);
    });

    this.socket.on('user-left', ({ userId: otherId }) => {
      this.pcs.get(otherId)?.close();
      this.pcs.delete(otherId);
      this.callbacks.onUserLeft?.(otherId);
    });

    this.socket.on('offer', async ({ fromUserId, offer }) => {
      const pc = this.ensurePeer(fromUserId);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket?.emit('answer', { roomId, targetUserId: fromUserId, answer });
    });

    this.socket.on('answer', async ({ fromUserId, answer }) => {
      await this.pcs.get(fromUserId)?.setRemoteDescription(answer);
    });

    this.socket.on('ice-candidate', async ({ fromUserId, candidate }) => {
      await this.pcs.get(fromUserId)?.addIceCandidate(candidate);
    });

    this.socket.on('gesture', (payload) => this.callbacks.onGesture?.(payload));
    this.socket.on('caption', (payload) => this.callbacks.onCaption?.(payload));
    this.socket.on('waiting-room', () => this.callbacks.onWaitingRoom?.());
    this.socket.on('admitted', () => this.callbacks.onAdmitted?.());
    this.socket.on('waiting-user', (payload) => this.callbacks.onWaitingUser?.(payload));
    this.socket.on('waiting-user-left', (payload) => this.callbacks.onWaitingUserLeft?.(payload));
    this.socket.on('host-mute-all', () => this.callbacks.onHostMuteAll?.());
  }

  sendGesture(gesture: Gesture) {
    this.socket?.emit('gesture', { roomId: this.roomId, userId: this.userId, gesture });
  }

  sendCaption(text: string) {
    this.socket?.emit('caption', { roomId: this.roomId, userId: this.userId, text });
  }

  admitUser(roomId: string, userId: string) {
    this.socket?.emit('admit-user', { roomId, userId });
  }

  hostMuteAll(roomId: string) {
    this.socket?.emit('host-mute-all', { roomId });
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  async startScreenShare() {
    if (this.screenStream) return;
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    this.screenStream = stream;
    this.replaceVideoTrack(track);

    track.onended = () => {
      try {
        this.stopScreenShare();
      } catch {}
    };
  }

  stopScreenShare() {
    if (!this.screenStream) return;
    const cameraTrack = this.localStream?.getVideoTracks()[0];
    if (cameraTrack) this.replaceVideoTrack(cameraTrack);

    this.screenStream.getTracks().forEach((track) => track.stop());
    this.screenStream = null;
  }

  dispose() {
    this.socket?.disconnect();
    this.pcs.forEach((pc) => pc.close());
    this.pcs.clear();
    this.stopScreenShare();
  }

  private replaceVideoTrack(track: MediaStreamTrack) {
    this.pcs.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(track);
    });
  }

  private ensurePeer(otherUserId: string) {
    if (this.pcs.has(otherUserId)) return this.pcs.get(otherUserId)!;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.localStream?.getTracks().forEach((t) => pc.addTrack(t, this.localStream!));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket?.emit('ice-candidate', { roomId: this.roomId, targetUserId: otherUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      window.dispatchEvent(new CustomEvent('webrtc:remote-stream', { detail: { userId: otherUserId, stream: e.streams[0] } }));
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket?.emit('offer', { roomId: this.roomId, targetUserId: otherUserId, offer });
      } catch {}
    };

    this.pcs.set(otherUserId, pc);
    return pc;
  }
}

export const webrtcClient = new WebRTCClient();
