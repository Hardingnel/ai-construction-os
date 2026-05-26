import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const docs = await db.document.findMany({
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
    const { name, type, data, projectId, url: inputUrl } = req.body;
    const doc = await db.document.create({
      data: { name, type, data, projectId, url: inputUrl || `/uploads/${Date.now()}_${name}` },
    });
    createNotification({ title: 'Document Uploaded', message: `"${name}" added to project documents`, type: 'info', link: `/documents?projectId=${projectId}`, userId: req.userId! }).catch(() => {});
  } catch (error) {
    res.status(500).json({ message: 'Failed to create document' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await db.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export { router as documentsRouter };
