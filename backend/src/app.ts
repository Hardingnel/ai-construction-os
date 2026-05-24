import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { designsRouter } from './routes/designs';
import { boqRouter } from './routes/boq';
import { tasksRouter } from './routes/tasks';
import { documentsRouter } from './routes/documents';
import { teamRouter } from './routes/team';
import { syncRouter } from './routes/sync';
import { uploadRouter } from './routes/upload';
import { realtimeRouter } from './routes/realtime';
import { statsRouter } from './routes/stats';
import { notificationsRouter } from './routes/notifications';
import { marketplaceRouter } from './routes/marketplace';
import { generationsRouter } from './routes/generations';
import { phasesRouter } from './routes/phases';
import { expensesRouter } from './routes/expenses';
import { gisRouter } from './routes/gis';
import { searchRouter } from './routes/search';
import { complianceRouter } from './routes/compliance';
import { sustainabilityRouter } from './routes/sustainability';
import { tutorRouter } from './routes/tutor';
import { interoperabilityRouter } from './routes/interoperability';
import { bimRouter } from './routes/bim';
import { pythonRouter } from './routes/python';
import { pdfRouter } from './routes/pdf';

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());
const io = new Server(httpServer, {
  cors: { origin: corsOrigins, methods: ['GET', 'POST'] },
});
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/designs', designsRouter);
app.use('/api/boq', boqRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/team', teamRouter);
app.use('/api/sync', syncRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/stats', statsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/generations', generationsRouter);
app.use('/api/phases', phasesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/gis', gisRouter);
app.use('/api/search', searchRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/sustainability', sustainabilityRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/interoperability', interoperabilityRouter);
app.use('/api/bim', bimRouter);
app.use('/api/python', pythonRouter);
app.use('/api/pdf', pdfRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  socket.on('join-project', (projectId: string) => socket.join(`project:${projectId}`));
  socket.on('leave-project', (projectId: string) => socket.leave(`project:${projectId}`));
  socket.on('project-update', (data) => socket.to(`project:${data.projectId}`).emit('project-changed', data));
  socket.on('comment', (data) => io.to(`project:${data.projectId}`).emit('new-comment', data));
  socket.on('join-user', (userId: string) => socket.join(`user:${userId}`));
  socket.on('leave-user', (userId: string) => socket.leave(`user:${userId}`));

  socket.on('register-user', (data: { userId: string; userName: string; avatar?: string }) => {
    socket.data.userId = data.userId;
    socket.data.userName = data.userName;
    socket.data.avatar = data.avatar;
  });

  socket.on('cursor-move', (data: { projectId: string; x: number; y: number }) => {
    if (!socket.data.userId) return;
    socket.to(`project:${data.projectId}`).emit('cursor-update', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      avatar: socket.data.avatar,
      x: data.x,
      y: data.y,
      timestamp: Date.now(),
    });
  });

  socket.on('doc-edit', (data: { projectId: string; documentId: string; content: string; version: number }) => {
    if (!socket.data.userId) return;
    socket.to(`project:${data.projectId}`).emit('doc-changed', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      documentId: data.documentId,
      content: data.content,
      version: data.version,
      timestamp: Date.now(),
    });
  });

  socket.on('collab-join', (data: { projectId: string }) => {
    if (!socket.data.userId) return;
    socket.join(`project:${data.projectId}`);
    socket.to(`project:${data.projectId}`).emit('user-joined', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      avatar: socket.data.avatar,
    });
  });

  socket.on('collab-leave', (data: { projectId: string }) => {
    socket.leave(`project:${data.projectId}`);
    socket.to(`project:${data.projectId}`).emit('user-left', {
      userId: socket.data.userId,
      userName: socket.data.userName,
    });
  });

  socket.on('disconnect', () => {});
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File too large. Maximum size is 50MB.' });
  if (error.message?.includes('File type not allowed')) return res.status(415).json({ message: error.message });
  res.status(500).json({ message: 'Internal server error' });
});

export function getIO() { return io; }

export function getPrisma() { return prisma; }

export { app, httpServer, io };
