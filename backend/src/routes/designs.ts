import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const designs = await prisma.design.findMany({
      where: { projectId: req.params.projectId, project: { userId: req.userId } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(designs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch designs' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, style, description, prompt, data, projectId } = req.body;
    const design = await prisma.design.create({
      data: { name, type, style, description, prompt, data: data ? JSON.stringify(data) : undefined, projectId },
    });
    res.status(201).json(design);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create design' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.design.delete({ where: { id: req.params.id } });
    res.json({ message: 'Design deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete design' });
  }
});

export { router as designsRouter };
