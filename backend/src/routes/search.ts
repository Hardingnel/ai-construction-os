import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q.length < 2) return res.json({ projects: [], designs: [], tasks: [] });
    const [projects, designs, tasks] = await Promise.all([
      db.project.findMany({ where: { userId: req.userId!, name: { contains: q } }, take: 10 }),
      db.design.findMany({ where: { userId: req.userId!, name: { contains: q } }, take: 10 }),
      db.task.findMany({ where: { project: { userId: req.userId! }, title: { contains: q } }, take: 10, include: { project: { select: { name: true } } } }),
    ]);
    res.json({ projects, designs, tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as searchRouter };
