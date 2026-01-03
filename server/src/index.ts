import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

dotenv.config();

import memoRoutes from './routes/memo.routes';
import calendarRoutes from './routes/calendar.routes';
import timelineRoutes from './routes/timeline.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import bookingRoutes from './routes/booking.routes';
import videoRoutes from './routes/video.routes';
import whiteboardRoutes from './routes/whiteboard.routes';
import pollRoutes from './routes/poll.routes';
import breakoutRoutes from './routes/breakout.routes';
import captionsRoutes from './routes/captions.routes';
import socialRoutes from './routes/social.routes';
import followRoutes from './routes/follow.routes';
import messageRoutes from './routes/message.routes';
import meetingRoutes from './routes/meeting.routes';
import qaRoutes from './routes/qa.routes';
import newRoutes from './routes/new_routes';
import adminRoutes from './routes/admin.routes';
import { initializeSocketServer } from './services/socket.service';
import { startReminderService } from './services/reminder.service';

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

// 修复: 生产环境 CORS 配置
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // 允许加载静态资源
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 修复: 静态文件服务路径
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', userRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/calendars', calendarRoutes);
app.use('/api/timelines', timelineRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/poll', pollRoutes);
app.use('/api/breakout', breakoutRoutes);
app.use('/api/captions', captionsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meeting', meetingRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/new', newRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 修复: 全局错误日志
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

initializeSocketServer(io);
startReminderService(); // 启动定时提醒服务

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };


