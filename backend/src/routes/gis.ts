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

/**
 * POST /api/gis/analyze
 * Gateway endpoint to Python AI service for GIS analysis
 * Accepts coordinates, area data, and analysis parameters
 * Returns analyzed GIS data with recommendations
 */
router.post('/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { coordinates, areaData, analysisType } = req.body;

    if (!coordinates) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    // Gateway to Python AI service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const analysisResponse = await fetch(`${pythonServiceUrl}/api/analyze/gis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates,
        areaData,
        analysisType: analysisType || 'default',
      }),
    });

    if (!analysisResponse.ok) {
      return res.status(analysisResponse.status).json({
        message: 'GIS analysis failed',
        details: await analysisResponse.text(),
      });
    }

    const analysis = await analysisResponse.json();
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as gisRouter };
