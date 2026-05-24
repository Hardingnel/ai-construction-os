import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { tasks: true, designs: true, boqItems: true } } },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        designs: true,
        boqItems: true,
        tasks: { include: { assignee: { select: { id: true, name: true, avatar: true } } } },
        comments: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, type, location, budget, style } = req.body;
    const project = await prisma.project.create({
      data: { name, description, type, location, budget: budget ? parseFloat(budget) : undefined, style, userId: req.userId! },
    });
    createNotification({ title: 'Project Created', message: `"${project.name}" has been created`, type: 'success', link: `/projects/${project.id}`, userId: req.userId! }).catch(() => {});
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.userId } });
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: req.body,
    });
    if (existing && req.body.name && existing.name !== req.body.name) {
      createNotification({ title: 'Project Renamed', message: `"${existing.name}" renamed to "${req.body.name}"`, type: 'info', link: `/projects/${req.params.id}`, userId: req.userId! }).catch(() => {});
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.project.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

export { router as projectsRouter };
