import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.bOQItem.findMany({
      where: { projectId: req.params.projectId, project: { userId: req.userId } },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch BOQ items' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { items, projectId } = req.body;
    const created = await prisma.bOQItem.createMany({
      data: items.map((item: any) => ({ ...item, projectId })),
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create BOQ items' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.bOQItem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update BOQ item' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.bOQItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'BOQ item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete BOQ item' });
  }
});

export { router as boqRouter };
