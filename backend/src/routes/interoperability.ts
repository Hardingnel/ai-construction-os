import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  importFile,
  exportModel,
  convertFile,
  getJobHistory,
  getJob,
  getConversionHistory,
  SUPPORTED_FORMATS,
} from '../services/interoperabilityService';

const router = Router();

router.get('/formats', async (_req, res: Response) => {
  res.json(SUPPORTED_FORMATS);
});

router.post('/import/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, fileName } = req.body;
    if (!content) return res.status(400).json({ message: 'File content is required' });
    const result = await importFile(req.params.projectId, req.userId!, content, fileName || 'imported_file');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/export/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.body;
    if (!format) return res.status(400).json({ message: 'Target format is required' });
    const result = await exportModel(req.params.projectId, req.userId!, format);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/convert', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, sourceFormat, targetFormat } = req.body;
    if (!content || !sourceFormat || !targetFormat) {
      return res.status(400).json({ message: 'Content, sourceFormat, and targetFormat are required' });
    }
    const result = await convertFile(req.userId!, content, sourceFormat, targetFormat);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/jobs/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await getJobHistory(req.params.projectId);
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/job/:jobId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/conversions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const records = await getConversionHistory(req.userId!);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as interoperabilityRouter };
