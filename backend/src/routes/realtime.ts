import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma, db } from '../app';

const router = Router();

router.get('/presence/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await db.comment.findMany({
      where: { projectId: req.params.projectId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, projectId, parentId } = req.body;
    const comment = await db.comment.create({
      data: { content, projectId, parentId, userId: req.userId! },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    const io = req.app.get('io');
    if (io) io.to(`project:${projectId}`).emit('new-comment', comment);
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/events/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const events = await db.project.findUnique({
      where: { id: req.params.projectId },
      select: { updatedAt: true },
    });
    res.json({ lastEvent: events?.updatedAt });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as realtimeRouter };
