import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const docs = await prisma.document.findMany({
      where: { projectId: req.params.projectId, project: { userId: req.userId } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, data, projectId } = req.body;
    const doc = await prisma.document.create({
      data: { name, type, data, projectId },
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create document' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export { router as documentsRouter };
