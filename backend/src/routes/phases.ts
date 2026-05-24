import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const phases = await prisma.projectPhase.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { order: 'asc' },
    });
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ phases, milestones });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/phases', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const phase = await prisma.projectPhase.create({ data: req.body });
    createNotification({ title: 'Phase Created', message: `Phase "${phase.name}" added to project`, type: 'info', link: `/phases?projectId=${phase.projectId}`, userId: req.userId! }).catch(() => {});
    res.status(201).json(phase);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/phases/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.projectPhase.findUnique({ where: { id: req.params.id } });
    const phase = await prisma.projectPhase.update({ where: { id: req.params.id }, data: req.body });
    if (existing && req.body.status && existing.status !== req.body.status) {
      createNotification({ title: 'Phase Status Changed', message: `Phase "${phase.name}" is now "${req.body.status}"`, type: 'info', link: `/phases?projectId=${phase.projectId}`, userId: req.userId! }).catch(() => {});
    }
    res.json(phase);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/milestones', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const milestone = await prisma.projectMilestone.create({ data: req.body });
    res.status(201).json(milestone);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/milestones/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const milestone = await prisma.projectMilestone.update({ where: { id: req.params.id }, data: req.body });
    res.json(milestone);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as phasesRouter };
