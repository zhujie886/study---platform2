import axios from 'axios';

// 优先使用环境变量，回退到本地开发地址
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = String(API_BASE).endsWith('/api') ? String(API_BASE) : `${String(API_BASE).replace(/\/$/, '')}/api`;

console.log('🚀 API base:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAdminRequest = url.startsWith('/admin') || url.includes('/admin');
    const token = isAdminRequest ? localStorage.getItem('adminToken') : localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 核心修复：增强错误拦截
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 遇到 401 (未登录) 或 403 (令牌结构无效/过期) 时，强制退出
      if (error.response.status === 401 || error.response.status === 403) {
        const path = window.location.pathname;
        // 避免在登录注册页死循环
        if (!path.includes('/login') && !path.includes('/register')) {
          console.warn('⚠️ 会话失效，正在清除本地数据...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('adminToken'); // 顺便清除管理员token
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ========= APIs =========
export const userAPI = {
  login: (data: any) => api.post('/users/login', data),
  register: (data: any) => api.post('/users/register', data),
  profile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

export const authAPI = {
  register: (data: any) => userAPI.register(data),
  login: (data: any) => userAPI.login(data),
  getProfile: () => userAPI.profile(),
  updateProfile: (data: any) => userAPI.updateProfile(data),
};

export const memoAPI = {
  create: (data: any) => api.post('/memos', data),
  getAll: (params?: any) => api.get('/memos', { params }),
  list: () => api.get('/memos'),
  getById: (id: string) => api.get(`/memos/${id}`),
  update: (id: string, data: any) => api.put(`/memos/${id}`, data),
  delete: (id: string) => api.delete(`/memos/${id}`),
  search: (params: any) => api.get('/memos/search', { params }),
};

export const calendarAPI = {
  create: (data: any) => api.post('/calendars', data),
  getAll: () => api.get('/calendars'),
  list: () => api.get('/calendars'),
  update: (id: string, data: any) => api.put(`/calendars/${id}`, data),
  delete: (id: string) => api.delete(`/calendars/${id}`),
};

export const timelineAPI = {
  create: (data: any) => api.post('/timelines', data),
  list: () => api.get('/timelines'),
  getByDate: (date: string) => api.get(`/timelines/${date}`),
  update: (date: string, data: any) => api.put(`/timelines/${date}`, data),
  delete: (date: string) => api.delete(`/timelines/${date}`),
};

export const qaAPI = {
  listCategories: () => api.get('/qa/categories'),
  createCategory: (data: any) => api.post('/qa/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/qa/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/qa/categories/${id}`),
  listTags: (params?: { q?: string }) => api.get('/qa/tags', { params }),
  createTag: (data: any) => api.post('/qa/tags', data),
  listQuestions: (params?: any) => api.get('/qa/questions', { params }),
  getQuestion: (id: string) => api.get(`/qa/questions/${id}`),
  createQuestion: (data: any) => api.post('/qa/questions', data),
  updateQuestion: (id: string, data: any) => api.put(`/qa/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/qa/questions/${id}`),
  createAnswer: (questionId: string, data: any) => api.post(`/qa/questions/${questionId}/answers`, data),
  updateAnswer: (id: string, data: any) => api.put(`/qa/answers/${id}`, data),
  deleteAnswer: (id: string) => api.delete(`/qa/answers/${id}`),
  acceptAnswer: (questionId: string, answerId: string) =>
    api.post(`/qa/questions/${questionId}/accept`, { answerId }),
  revokeAccept: (questionId: string) => api.delete(`/qa/questions/${questionId}/accept`),
  resolveQuestion: (questionId: string) => api.post(`/qa/questions/${questionId}/resolve`, {}),
  reopenQuestion: (questionId: string) => api.post(`/qa/questions/${questionId}/reopen`, {}),
};

export const bookingAPI = {
  createSlot: (data: any) => api.post('/booking/slots', data),
  mySlots: () => api.get('/booking/slots/my'),
  slotsByUser: (userId: string) => api.get(`/booking/slots/user/${userId}`),
  updateSlot: (id: string, data: any) => api.put(`/booking/slots/${id}`, data),
  deleteSlot: (id: string) => api.delete(`/booking/slots/${id}`),
  createBooking: (data: any) => api.post('/booking/bookings', data),
  myBookings: () => api.get('/booking/bookings/my'),
  updateStatus: (id: string, action: 'confirm'|'cancel'|'complete') =>
    api.put(`/booking/bookings/${id}/status`, { action }),
  pay: (id: string) => api.post(`/booking/bookings/${id}/pay`, {}),
  attachRoom: (id: string, data: { title?: string; password?: string }) =>
    api.post(`/booking/bookings/${id}/room`, data),
};

export const videoAPI = {
  createRoom: (data: any) => api.post('/video/rooms', data),
  getRoom: (id: string) => api.get(`/video/rooms/${id}`),
  joinRoom: (id: string) => api.post(`/video/rooms/${id}/join`, {}),
  startRoom: (id: string) => api.post(`/video/rooms/${id}/start`, {}),
  endRoom: (id: string) => api.post(`/video/rooms/${id}/end`, {}),
  startRecord: (id: string) => api.post(`/video/rooms/${id}/record/start`, {}),
  stopRecord: (id: string, url?: string) => api.post(`/video/rooms/${id}/record/stop`, { recordingUrl: url }),
};

export const whiteboardAPI = {
  create: (data: any) => api.post('/whiteboard', data),
  listByRoom: (rid: string) => api.get(`/whiteboard/room/${rid}`),
  addAction: (id: string, data: any) => api.post(`/whiteboard/${id}/actions`, data),
  listActions: (id: string) => api.get(`/whiteboard/${id}/actions`),
  clear: (id: string) => api.post(`/whiteboard/${id}/clear`, {})
};

export const pollAPI = {
  create: (data: any) => api.post('/poll', data),
  listByRoom: (rid: string) => api.get(`/poll/room/${rid}`),
  vote: (id: string, data: any) => api.post(`/poll/${id}/vote`, data),
  results: (id: string) => api.get(`/poll/${id}/results`)
};

export const breakoutAPI = {
  create: (data: any) => api.post('/breakout', data),
  listByRoom: (rid: string) => api.get(`/breakout/room/${rid}`),
  join: (id: string, data: any) => api.post(`/breakout/${id}/join`, data),
  leave: (id: string, data: any) => api.post(`/breakout/${id}/leave`, data),
};

export const captionsAPI = {
  push: (rid: string, text: string) => api.post(`/captions/${rid}`, { text }),
  list: (rid: string) => api.get(`/captions/${rid}`)
};

export const messageAPI = {
  listByRoom: (rid: string) => api.get(`/messages/room/${rid}`),
  send: (data: any) => api.post('/messages', data)
};

export const meetingAPI = {
  createWithLink: (data: any) => api.post('/meeting/create-link', data),
  joinByLink: (link: string) => api.post('/meeting/join-link', { link }),
  invitations: () => api.get('/meeting/invitations'),
};

export const adminAPI = {
  getMemos: () => api.get('/admin/memos'),
  getMeetings: () => api.get('/admin/meetings'),
  getPosts: () => api.get('/admin/posts'),
  deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
  login: (key: string) => api.post('/admin/login', { key }),
  getStats: () => api.get('/admin/stats'),
  dashboardStats: () => api.get('/admin/stats'),
  getAllUsers: (search?: string) => api.get('/admin/users', { params: { search } }),
  users: (search?: string) => api.get('/admin/users', { params: { search } }),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  resetUserPassword: (id: string, data: { password: string }) =>
    api.patch(`/admin/users/${id}/password`, data),
  muteUser: (id: string, data: { days?: number | string; until?: string; reason?: string }) =>
    api.patch(`/admin/users/${id}/mute`, data),
  unmuteUser: (id: string) => api.patch(`/admin/users/${id}/unmute`),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  logs: (params?: { type?: 'out' | 'err'; lines?: number }) => api.get('/admin/logs', { params }),
};




