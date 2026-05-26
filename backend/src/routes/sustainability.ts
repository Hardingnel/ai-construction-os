import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { assessSustainability, getAssessmentHistory, getLatestAssessment } from '../services/sustainabilityService';
import { createNotification } from './notifications';

const router = Router();

router.post('/assess/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const project = await db.project.findUnique({ where: { id: req.params.projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const result = await assessSustainability({ projectId: project.id, userId: req.userId! });
    createNotification({ title: 'Sustainability Assessment Complete', message: `Rating: ${result.overallRating || 'N/A'} — Score: ${result.overallScore?.toFixed(1) || 'N/A'}`, type: 'info', link: `/sustainability?projectId=${project.id}`, userId: req.userId! }).catch(() => {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/assessments/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const history = await getAssessmentHistory(req.params.projectId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/latest/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await getLatestAssessment(req.params.projectId);
    if (!assessment) return res.status(404).json({ message: 'No assessment found' });
    res.json({
      ...assessment,
      recommendations: assessment.recommendations ? JSON.parse(assessment.recommendations) : [],
      breakdown: assessment.data ? JSON.parse(assessment.data) : {},
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/report/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await getLatestAssessment(req.params.projectId);
    if (!assessment) return res.status(404).json({ message: 'No sustainability assessment found. Run an assessment first.' });
    const result = {
      ...assessment,
      recommendations: assessment.recommendations ? JSON.parse(assessment.recommendations) : [],
      breakdown: assessment.data ? JSON.parse(assessment.data) : {},
    };
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/recommendations/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const assessment = await getLatestAssessment(req.params.projectId);
    if (!assessment || !assessment.recommendations) {
      res.json([]);
      return;
    }
    res.json(JSON.parse(assessment.recommendations));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as sustainabilityRouter };
