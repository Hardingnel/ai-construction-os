import { Router, Response } from 'express';
import { db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

function getTenantId(req: AuthRequest): string | undefined {
  return (req.headers['x-tenant-id'] as string) || undefined;
}

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    const tenantId = getTenantId(req);
    if (tenantId) {
      where.tenantId = tenantId;
    } else {
      const user = await db.user.findUnique({ where: { id: req.userId }, select: { tenantId: true } });
      if (user?.tenantId) where.tenantId = user.tenantId;
    }
    const projects = await db.project.findMany({
      where,
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
    const where: any = { id: req.params.id };
    const tenantId = getTenantId(req);
    if (tenantId) where.tenantId = tenantId;
    const project = await db.project.findFirst({
      where,
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
    let tenantId = getTenantId(req);
    if (!tenantId) {
      const user = await db.user.findUnique({ where: { id: req.userId }, select: { tenantId: true } });
      tenantId = user?.tenantId || undefined;
    }
    const project = await db.project.create({
      data: { name, description, type, location, budget: budget ? parseFloat(budget) : undefined, style, userId: req.userId!, tenantId: tenantId! },
    });
    createNotification({ title: 'Project Created', message: `"${project.name}" has been created`, type: 'success', link: `/projects/${project.id}`, userId: req.userId! }).catch(() => {});
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    const tenantId = getTenantId(req);
    if (tenantId) where.tenantId = tenantId;
    const existing = await db.project.findFirst({ where: { ...where, userId: req.userId } });
    const project = await db.project.updateMany({
      where: { ...where, userId: req.userId },
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
    const where: any = { id: req.params.id };
    const tenantId = getTenantId(req);
    if (tenantId) where.tenantId = tenantId;
    await db.project.deleteMany({ where });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

export { router as projectsRouter };
