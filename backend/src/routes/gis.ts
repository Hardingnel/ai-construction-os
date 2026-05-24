import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    const where = projectId ? { projectId } : {};
    const gisData = await prisma.gISData.findMany({ where });
    res.json(gisData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const gisData = await prisma.gISData.findMany({
      where: { projectId: req.params.projectId },
    });
    res.json(gisData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const gisData = await prisma.gISData.create({ data: req.body });
    res.status(201).json(gisData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as gisRouter };
