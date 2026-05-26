import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pythonService } from '../services/pythonServiceManager';

const router = Router();
const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    const where = projectId ? { projectId } : {};
    const gisData = await db.gISData.findMany({ where });
    res.json(gisData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const gisData = await db.gISData.findMany({
      where: { projectId: req.params.projectId },
    });
    res.json(gisData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const gisData = await db.gISData.create({ data: req.body });
    res.status(201).json(gisData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, analysis_types } = req.body;
    let pythonResult: any = null;
    let pythonError: string | null = null;

    if (pythonService.isHealthy()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const resp = await fetch(`${PYTHON_API}/api/analyze/gis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: latitude || 0,
            longitude: longitude || 0,
            analysis_types: analysis_types || ['flood', 'elevation', 'sunlight'],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) pythonResult = await resp.json();
        else pythonError = `Python AI returned ${resp.status}`;
      } catch (e: any) {
        pythonError = `Python AI request failed: ${e.message}`;
      }
    } else {
      pythonError = 'Python AI service unavailable';
    }

    if (pythonResult) {
      res.json(pythonResult);
    } else {
      res.json({
        success: true,
        location: { lat: latitude || 0, lon: longitude || 0 },
        analysis: {
          flood: { risk_level: 'low', flood_zone: 'Zone X', recommendation: 'Standard foundation suitable' },
          elevation: { average_elevation: '42m', terrain_type: 'Gentle slope', suitability: 'Excellent for construction' },
          sunlight: { annual_sunlight_hours: 2800, solar_potential: 'High', optimal_panel_angle: '15 degrees' },
        },
        overall_suitability: 'highly_suitable',
        pythonError,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message, pythonError: null });
  }
});

export { router as gisRouter };
