import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../app';
import { generateComplianceReport, generateBOQReport, generateSustainabilityReport } from '../services/pdfService';

const router = Router();

router.get('/compliance/:checkId', authenticate, async (req: AuthRequest, res: Response) => {
  const check = await prisma.complianceCheck.findUnique({
    where: { id: req.params.checkId },
    include: { results: true, project: true },
  });
  if (!check || check.userId !== req.userId!) {
    return res.status(404).json({ error: 'Not found' });
  }
  const pdf = await generateComplianceReport(check);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=compliance-${check.id}.pdf`);
  res.send(pdf);
});

router.get('/boq/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    include: { boqItems: true },
  });
  if (!project || project.userId !== req.userId!) {
    return res.status(404).json({ error: 'Not found' });
  }
  const pdf = await generateBOQReport(project);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=boq-${project.id}.pdf`);
  res.send(pdf);
});

router.get('/sustainability/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  const assessment = await prisma.sustainabilityAssessment.findFirst({
    where: { projectId: req.params.projectId },
  });
  if (!assessment) {
    return res.status(404).json({ error: 'Not found' });
  }
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project || project.userId !== req.userId!) {
    return res.status(404).json({ error: 'Not found' });
  }
  const pdf = await generateSustainabilityReport(assessment, project);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=sustainability-${project.id}.pdf`);
  res.send(pdf);
});

export { router as pdfRouter };
