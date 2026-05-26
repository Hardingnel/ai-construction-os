import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { runComplianceCheck, getSupportedCountries } from '../services/complianceService';
import { createNotification } from './notifications';

const router = Router();

router.get('/countries', (_req, res: Response) => {
  res.json(getSupportedCountries());
});

router.get('/codes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const codes = await prisma.buildingCode.findMany({
      where: req.query.country ? { country: req.query.country as string } : {},
      orderBy: [{ country: 'asc' }, { code: 'asc' }],
    });
    res.json(codes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/check/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { country } = req.body;
    if (!country) return res.status(400).json({ message: 'Country is required' });

    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, userId: req.userId },
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const summary = await runComplianceCheck(project, country);

    const check = await prisma.complianceCheck.create({
      data: {
        projectId: project.id,
        userId: req.userId!,
        country,
        status: summary.failed > 0 ? 'failed' : summary.warnings > 0 ? 'warning' : 'passed',
        summary: `${summary.passed}/${summary.total} checks passed`,
        score: summary.score,
        passedItems: summary.passed,
        failedItems: summary.failed,
        warningItems: summary.warnings,
        completedAt: new Date(),
      },
    });

    for (const result of summary.results) {
      await prisma.complianceCheckResult.create({
        data: {
          checkId: check.id,
          passed: result.status === 'passed',
          status: result.status,
          title: result.title,
          description: result.description,
          requirement: result.requirement,
          finding: result.finding,
          recommendation: result.recommendation,
          category: result.category,
          severity: result.severity,
        },
      });
    }

    if (summary.failed > 0) {
      createNotification({ title: 'Compliance Check Failed', message: `${summary.failed} compliance check${summary.failed > 1 ? 's' : ''} failed for "${project.name}" (${country})`, type: 'warning', link: `/compliance?projectId=${project.id}`, userId: req.userId! }).catch(() => {});
    } else if (summary.warnings > 0) {
      createNotification({ title: 'Compliance Warnings', message: `${summary.warnings} warning${summary.warnings > 1 ? 's' : ''} for "${project.name}" (${country})`, type: 'info', link: `/compliance?projectId=${project.id}`, userId: req.userId! }).catch(() => {});
    } else {
      createNotification({ title: 'Compliance Check Passed', message: `All ${summary.total} checks passed for "${project.name}" (${country})`, type: 'success', link: `/compliance?projectId=${project.id}`, userId: req.userId! }).catch(() => {});
    }
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/history/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const checks = await prisma.complianceCheck.findMany({
      where: { projectId: req.params.projectId, userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(checks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/results/:checkId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const check = await prisma.complianceCheck.findFirst({
      where: { id: req.params.checkId, userId: req.userId },
      include: { results: { orderBy: { createdAt: 'asc' } } },
    });
    if (!check) return res.status(404).json({ message: 'Check not found' });
    res.json(check);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/seed', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.buildingCode.count();
    if (existing > 0) return res.json({ message: `Already seeded: ${existing} codes` });

    const codes: Array<{ country: string; code: string; title: string; description: string; category: string; requirement: string; severity: string }> = [
      { country: 'sierra-leone', code: 'SL-BUILD-001', title: 'Minimum Floor Height', description: 'Ground floor must be minimum 300mm above adjacent road level for flood resilience.', category: 'Structural', requirement: 'Floor elevation >= 300mm above road level', severity: 'mandatory' },
      { country: 'sierra-leone', code: 'SL-BUILD-002', title: 'Wind Resistance', description: 'Structures must withstand wind speeds up to 120 km/h.', category: 'Structural', requirement: 'Structural design for 120 km/h wind load', severity: 'mandatory' },
      { country: 'sierra-leone', code: 'SL-FIRE-001', title: 'Fire Escape Routes', description: 'Buildings over 2 floors must have minimum 2 fire escape routes.', category: 'Fire Safety', requirement: '2+ fire escapes for buildings >2 floors', severity: 'mandatory' },
      { country: 'sierra-leone', code: 'SL-ENV-001', title: 'Natural Ventilation', description: 'Habitable rooms must have ventilation openings >=10% of floor area.', category: 'Environmental', requirement: 'Ventilation area >=10% of floor area', severity: 'advisory' },
      { country: 'sierra-leone', code: 'SL-ENV-002', title: 'Rainwater Management', description: 'New buildings should include rainwater harvesting systems.', category: 'Environmental', requirement: 'Rainwater harvesting system recommended', severity: 'advisory' },
      { country: 'sierra-leone', code: 'SL-ACC-001', title: 'Accessibility', description: 'Public buildings must provide wheelchair access with max 1:12 slope.', category: 'Accessibility', requirement: 'Wheelchair ramp with <=1:12 slope', severity: 'mandatory' },
      { country: 'nigeria', code: 'NG-BUILD-001', title: 'Foundation Depth', description: 'Minimum foundation depth of 900mm in lateritic soils.', category: 'Structural', requirement: 'Foundation depth >=900mm', severity: 'mandatory' },
      { country: 'nigeria', code: 'NG-BUILD-002', title: 'Setback Requirements', description: 'Minimum 3m setback from property boundaries for residential buildings.', category: 'Zoning', requirement: 'Setback >=3m from property boundaries', severity: 'mandatory' },
      { country: 'nigeria', code: 'NG-FIRE-001', title: 'Fire Extinguisher Access', description: 'Fire extinguishers required every 200m² and within 30m of any point.', category: 'Fire Safety', requirement: 'Fire extinguisher coverage every 200m²', severity: 'mandatory' },
      { country: 'nigeria', code: 'NG-ENV-001', title: 'Waste Management', description: 'Construction waste management plan recommended for projects over 500m².', category: 'Environmental', requirement: 'Waste management plan for projects >500m²', severity: 'advisory' },
      { country: 'ghana', code: 'GH-BUILD-001', title: 'Sanitary Facilities', description: 'Minimum 1 toilet per 15 occupants.', category: 'Plumbing', requirement: '1 toilet per 15 occupants', severity: 'mandatory' },
      { country: 'ghana', code: 'GH-BUILD-002', title: 'Floor Loading', description: 'Minimum 2.5 kN/m² live load for residential floors.', category: 'Structural', requirement: 'Floor design for 2.5 kN/m² live load', severity: 'mandatory' },
      { country: 'ghana', code: 'GH-ENV-001', title: 'Drainage System', description: 'Stormwater drainage must handle 100mm/hr rainfall intensity.', category: 'Environmental', requirement: 'Drainage for 100mm/hr rainfall', severity: 'mandatory' },
    ];

    await prisma.buildingCode.createMany({ data: codes });
    res.json({ message: `Seeded ${codes.length} building codes` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as complianceRouter };
