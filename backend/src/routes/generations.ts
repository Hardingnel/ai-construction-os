import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pythonService } from '../services/pythonServiceManager';

const router = Router();
const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const generations = await prisma.aIGeneration.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(generations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, type, style, bedrooms, floors } = req.body;

    let pythonResult: any = null;
    let pythonError: string | null = null;

    if (pythonService.isHealthy()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const resp = await fetch(`${PYTHON_API}/api/generate/design`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            building_type: type || 'residential',
            style: style || 'modern',
            bedrooms: bedrooms || 3,
            floors: floors || 1,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          pythonResult = await resp.json();
        } else {
          pythonError = `Python AI returned ${resp.status}`;
        }
      } catch (e: any) {
        pythonError = `Python AI request failed: ${e.message}`;
      }
    } else {
      pythonError = 'Python AI service unavailable';
    }

    const resultData = pythonResult?.design || {
      name: `${style || 'Modern'} ${type || 'Building'}`,
      type: type || 'residential',
      style: style || 'modern',
      bedrooms: bedrooms || 3,
      floors: floors || 1,
      area_sqm: (bedrooms || 3) * 75 + (floors || 1) * 50,
      features: ['Open floor plan', 'Natural lighting', 'Energy efficient'],
      room_layout: { living_room: '6m x 8m', kitchen: '4m x 5m', master_bedroom: '5m x 6m' },
      recommendations: ['Use reinforced concrete frame', 'Install solar panels'],
      _fallback: !pythonResult,
    };

    const gen = await prisma.aIGeneration.create({
      data: {
        prompt,
        type: type || 'design',
        result: JSON.stringify(resultData),
        model: pythonResult ? 'ai-cos-python' : 'fallback-engine',
        userId: req.userId!,
      },
    });

    res.status(201).json({ ...gen, pythonError });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const gen = await prisma.aIGeneration.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!gen) return res.status(404).json({ message: 'Generation not found' });
    res.json(gen);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as generationsRouter };
