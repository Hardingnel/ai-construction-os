import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma, db } from '../app';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const notifications = await db.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  const count = await db.notification.count({
    where: { userId: req.userId!, read: false },
  });
  res.json({ count });
});

router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  await db.notification.updateMany({
    where: { id: req.params.id, userId: req.userId! },
    data: { read: true },
  });
  res.json({ success: true });
});

router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  await db.notification.updateMany({
    where: { userId: req.userId!, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, message, type, link, userId } = req.body;
  const notification = await db.notification.create({
    data: { title, message, type: type || 'info', link, userId: userId || req.userId! },
  });
  const { getIO } = await import('../app');
  const io = getIO();
  if (io) {
    io.to(`user:${notification.userId}`).emit('notification', notification);
  }
  res.json(notification);
});

export { router as notificationsRouter };

export async function createNotification(data: {
  title: string;
  message: string;
  type?: string;
  link?: string;
  userId: string;
}) {
  const notification = await db.notification.create({
    data: { title: data.title, message: data.message, type: data.type || 'info', link: data.link, userId: data.userId },
  });
  try {
    const { getIO } = await import('../app');
    const io = getIO();
    if (io) {
      io.to(`user:${notification.userId}`).emit('notification', notification);
    }
  } catch {}
  return notification;
}
