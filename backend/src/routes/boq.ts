import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) return res.status(400).json({ message: 'projectId query param required' });
    const items = await db.bOQItem.findMany({
      where: { projectId, project: { userId: req.userId } },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch BOQ items' });
  }
});

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const items = await db.bOQItem.findMany({
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
    const created = await db.bOQItem.createMany({
      data: items.map((item: any) => ({ ...item, projectId })),
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create BOQ items' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await db.bOQItem.update({
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
    await db.bOQItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'BOQ item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete BOQ item' });
  }
});

export { router as boqRouter };
