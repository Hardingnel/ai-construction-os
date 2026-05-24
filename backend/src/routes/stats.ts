import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const [totalProjects, activeProjects, totalDesigns, teamCount, totalTasks, completedTasks, recentProjects] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: 'active' } }),
      prisma.design.count({ where: { userId } }),
      prisma.teamMember.count(),
      prisma.task.count({ where: { project: { userId } } }),
      prisma.task.count({ where: { project: { userId }, status: 'completed' } }),
      prisma.project.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, name: true, type: true, status: true, updatedAt: true } }),
    ]);
    res.json({
      totalProjects,
      activeProjects,
      totalDesigns,
      teamCount,
      totalTasks,
      completedTasks,
      recentProjects,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/activity', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as statsRouter };
