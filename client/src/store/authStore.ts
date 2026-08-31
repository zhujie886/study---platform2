import { create } from 'zustand';
import { authAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import {
  isDemoAuthEnabled,
  isDemoToken,
  loginDemoAccount,
  registerDemoAccount,
  updateDemoAccount,
} from '@/services/demoAuth';

interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { username?: string; avatar?: string }) => Promise<void>;
  initAuth: () => Promise<void>;
}

const storedToken = localStorage.getItem('token');
let storedUser: User | null = null;
const storedUserStr = localStorage.getItem('user');

if (storedUserStr) {
  try {
    storedUser = JSON.parse(storedUserStr);
  } catch {
    storedUser = null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      if (isDemoAuthEnabled()) {
        const { user, token } = await loginDemoAccount(email, password);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
        return;
      }

      const response = await authAPI.login({ email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true });

      socketService.connect(user.id);
    } catch (error: any) {
      console.error('Auth Store Login Error:', error);
      // 🚨 修复：如果API有返回具体错误文字，使用它；否则抛出原始错误对象
      throw error; 
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true });
    try {
      if (isDemoAuthEnabled()) {
        const { user, token } = await registerDemoAccount(email, username, password);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
        return;
      }

      const response = await authAPI.register({ email, username, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true });

      socketService.connect(user.id);
    } catch (error: any) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data: { username?: string; avatar?: string }) => {
    try {
      const currentUser = get().user;
      if (isDemoAuthEnabled() && currentUser) {
        const updatedUser = updateDemoAccount(currentUser, data);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
        return;
      }

      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error: any) {
      throw error;
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) return;

    let user: User | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        user = null;
      }
    }

    set({ user, token, isAuthenticated: true });

    if (isDemoAuthEnabled()) {
      if (isDemoToken(token)) return;

      // Discard stale server tokens left by an older deployment before
      // switching this browser to local portfolio authentication.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    const connectSocket = (nextUser: User | null) => {
      if (!nextUser?.id) return;
      setTimeout(() => {
        try {
          socketService.connect(nextUser.id);
        } catch (error) {
          console.warn('WebSocket连接失败', error);
        }
      }, 1000);
    };

    connectSocket(user);

    try {
      const response = await authAPI.getProfile();
      const freshUser = response.data;
      if (freshUser) {
        localStorage.setItem('user', JSON.stringify(freshUser));
        set({ user: freshUser, token, isAuthenticated: true });
        connectSocket(freshUser);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      } else {
        console.warn('Profile check failed, keeping session', error);
      }
    }
  },
}));
