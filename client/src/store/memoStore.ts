import { create } from 'zustand';
import { memoAPI } from '@/services/api';

export interface Memo {
  id: string;
  userId: string;
  title: string;
  content: string;
  labels: string[];
  priority: number;
  color?: string;
  reminderTime?: string;
  locationReminder?: string;
  isEncrypted: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface MemoState {
  memos: Memo[];
  currentMemo: Memo | null;
  isLoading: boolean;
  filters: {
    status?: string;
    labels?: string[];
    priority?: number;
    searchQuery?: string;
  };
  fetchMemos: () => Promise<void>;
  fetchMemoById: (id: string) => Promise<void>;
  createMemo: (data: any) => Promise<Memo>;
  updateMemo: (id: string, data: any) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  searchMemos: (query: string, labels?: string[]) => Promise<void>;
  setFilters: (filters: any) => void;
  addMemo: (memo: Memo) => void;
  removeMemo: (id: string) => void;
  updateMemoInList: (memo: Memo) => void;
}

export const useMemoStore = create<MemoState>((set, get) => ({
  memos: [],
  currentMemo: null,
  isLoading: false,
  filters: {},

  fetchMemos: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      // 修复：确保调用的是 api.ts 中存在的 getAll 方法
      const response = await memoAPI.getAll(filters);

      // 后端返回格式可能包裹在 { memos: [], pagination: {} } 中，也可能是直接数组
      const data = response.data.memos ? response.data.memos : response.data;

      const memos = Array.isArray(data) ? data.map((memo: any) => ({
        ...memo,
        labels: Array.isArray(memo.labels) 
          ? memo.labels 
          : (memo.labels ? JSON.parse(memo.labels) : []),
        attachments: Array.isArray(memo.attachments)
          ? memo.attachments
          : (memo.attachments ? JSON.parse(memo.attachments) : [])
      })) : [];

      set({ memos });
    } catch (error) {
      console.error('Failed to fetch memos:', error);
      set({ memos: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMemoById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await memoAPI.getById(id);
      set({ currentMemo: response.data });
    } catch (error) {
      console.error('Failed to fetch memo:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMemo: async (data: any) => {
    const response = await memoAPI.create(data);
    const newMemo = response.data;
    // 立即更新状态，不需要等待 fetchMemos
    set((state) => ({ memos: [newMemo, ...state.memos] }));
    return newMemo;
  },

  updateMemo: async (id: string, data: any) => {
    const response = await memoAPI.update(id, data);
    const updatedMemo = response.data;
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? updatedMemo : m)),
      currentMemo: state.currentMemo?.id === id ? updatedMemo : state.currentMemo,
    }));
  },

  deleteMemo: async (id: string) => {
    await memoAPI.delete(id);
    set((state) => ({
      memos: state.memos.filter((m) => m.id !== id),
      currentMemo: state.currentMemo?.id === id ? null : state.currentMemo,
    }));
  },

  searchMemos: async (query: string, labels?: string[]) => {
    set({ isLoading: true });
    try {
      const params: any = { q: query };
      if (labels && labels.length > 0) {
        params.labels = labels.join(',');
      }
      // 修复：确保调用 search 方法
      const response = await memoAPI.search(params);
      const data = response.data.memos ? response.data.memos : response.data;
      set({ memos: data || [] });
    } catch (error) {
      console.error('Failed to search memos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (filters: any) => {
    set({ filters });
    get().fetchMemos();
  },

  addMemo: (memo: Memo) => {
    set((state) => ({ memos: [memo, ...state.memos] }));
  },

  removeMemo: (id: string) => {
    set((state) => ({
      memos: state.memos.filter((m) => m.id !== id),
    }));
  },

  updateMemoInList: (memo: Memo) => {
    set((state) => ({
      memos: state.memos.map((m) => (m.id === memo.id ? memo : m)),
    }));
  },
}));


