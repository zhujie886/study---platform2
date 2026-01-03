import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import Dashboard from '@/pages/Dashboard';
import MemoPage from '@/pages/MemoPage';
import CalendarPage from '@/pages/CalendarPage';
import TimelinePage from '@/pages/TimelinePage';
import BookingPage from '@/pages/BookingPage';
import ServiceBookingPage from '@/pages/ServiceBookingPage';
import VideoLobbyPage from '@/pages/VideoLobbyPage';
import VideoRoomPage from '@/pages/VideoRoomPage';
import SocialPage from '@/pages/SocialPage';
import CommunityPage from '@/pages/CommunityPage';
import QuestionDetailPage from '@/pages/QuestionDetailPage';
import PostDetailPage from '@/pages/PostDetailPage';
import UserProfilePage from '@/pages/UserProfilePage';
import ConsultantProfilePage from '@/pages/ConsultantProfilePage';
import ServiceDetailPage from '@/pages/ServiceDetailPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import ThemeBackground from '@/components/ThemeBackground';
import VideoConferencePage from './pages/VideoConferencePage'; // Import the new page
import PersonalizePage from '@/pages/Personalize';
import BookingCheckoutPage from '@/pages/booking/BookingCheckoutPage';

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <ThemeBackground />
      <Routes>
        {/* === 管理员路由 === */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
        </Route>

        {/* === 用户认证 === */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* === 公共服务页 === */}
        <Route path="/consultant/:id" element={<ConsultantProfilePage />} />
        <Route path="/service/:serviceId" element={<ServiceDetailPage />} />

        {/* === 独立全屏页面 (视频会议) === */}
        <Route
          path="/video/demo"
          element={
            <ProtectedRoute>
              <VideoLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/:id"
          element={
            <ProtectedRoute>
              <VideoRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/conference"
          element={
            <ProtectedRoute>
              <VideoConferencePage />
            </ProtectedRoute>
          }
        />

        {/* === 主应用布局 (带侧边栏) === */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="memos" element={<MemoPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="booking/services" element={<ServiceBookingPage />} />
          <Route path="booking/checkout/:serviceId" element={<BookingCheckoutPage />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="community/:id" element={<QuestionDetailPage />} />
          <Route path="post/:id" element={<PostDetailPage />} />
          <Route path="personalize" element={<PersonalizePage />} />
          <Route path="profile/:userId" element={<UserProfilePage />} />
          {/* 侧边栏点击会议只去大厅 */}
          <Route path="video" element={<VideoLobbyPage />} />
        </Route>
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#363636', color: '#fff' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}

export default App;
