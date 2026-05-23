import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { designsRouter } from './routes/designs';
import { boqRouter } from './routes/boq';
import { tasksRouter } from './routes/tasks';
import { documentsRouter } from './routes/documents';
import { teamRouter } from './routes/team';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/designs', designsRouter);
app.use('/api/boq', boqRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/team', teamRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-project', (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('project-update', (data) => {
    socket.to(`project:${data.projectId}`).emit('project-changed', data);
  });

  socket.on('comment', (data) => {
    io.to(`project:${data.projectId}`).emit('new-comment', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`AI COS Backend running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});
