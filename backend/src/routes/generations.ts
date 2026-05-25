import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pythonService } from '../services/pythonServiceManager';

const router = Router();
const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:8000';

const PYTHON_ENDPOINTS: Record<string, { path: string; resultKey: string | null }> = {
  design: { path: '/api/generate/design', resultKey: 'design' },
  boq: { path: '/api/generate/boq', resultKey: 'boq' },
  gis: { path: '/api/analyze/gis', resultKey: null },
  structural: { path: '/api/analyze/structural', resultKey: 'structural_recommendations' },
};

const FALLBACKS: Record<string, any> = {
  design: (body: any) => ({
    name: `${body.style || 'Modern'} ${body.building_type || 'Building'}`,
    type: body.building_type || 'residential',
    style: body.style || 'modern',
    bedrooms: body.bedrooms || 3,
    floors: body.floors || 1,
    area_sqm: (body.bedrooms || 3) * 75 + (body.floors || 1) * 50,
    features: ['Open floor plan', 'Natural lighting', 'Energy efficient'],
    room_layout: { living_room: '6m x 8m', kitchen: '4m x 5m', master_bedroom: '5m x 6m' },
    recommendations: ['Use reinforced concrete frame', 'Install solar panels'],
    _fallback: true,
  }),
  boq: (_: any) => ({
    total_estimated_cost: 206250,
    cost_per_sqm: 750,
    breakdown: { materials: 113437.5, labor: 51562.5, equipment: 20625, permits_and_fees: 10312.5, contingency: 10312.5 },
    items: [{ item: 'Concrete (Grade 30)', unit: 'm\u00B3', quantity: 82.5, rate: 185 }],
    _fallback: true,
  }),
  gis: (_: any) => ({
    location: { lat: 0, lon: 0 },
    analysis: { flood: { risk_level: 'low', flood_zone: 'Zone X' }, elevation: { terrain_type: 'Gentle slope', suitability: 'Good' }, sunlight: { solar_potential: 'High' } },
    overall_suitability: 'moderate',
    _fallback: true,
  }),
  structural: (_: any) => ({
    foundation: 'Raft foundation recommended',
    columns: { size: '300mm x 300mm', spacing: '6m grid', reinforcement: '8Y16 bars' },
    beams: { size: '450mm x 750mm', reinforcement: '4Y20 top + 4Y20 bottom' },
    slabs: { thickness: '150mm', reinforcement: 'Y12@150mm' },
    soil_requirements: { bearing_capacity: '150 kN/m\u00B2', recommended_depth: '1.5m' },
    _fallback: true,
  }),
};

function buildPythonBody(type: string, body: any): any {
  switch (type) {
    case 'design':
      return { prompt: body.prompt, building_type: body.building_type || 'residential', style: body.style || 'modern', bedrooms: body.bedrooms || 3, floors: body.floors || 1, location: body.location };
    case 'boq':
      return { project_type: body.project_type || 'residential', area_sqm: body.area_sqm || 250, floors: body.floors || 1, quality_level: body.quality_level || 'standard', location: body.location };
    case 'gis':
      return { latitude: body.latitude || 0, longitude: body.longitude || 0, analysis_types: body.analysis_types || ['flood', 'elevation', 'sunlight'] };
    case 'structural':
      return { building_type: body.building_type || 'residential', floors: body.floors || 1, span_length: body.span_length || 6, soil_type: body.soil_type || 'medium', seismic_zone: body.seismic_zone || 'zone_2' };
    default:
      return body;
  }
}

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
    const { prompt, type = 'design', ...params } = req.body;
    const normalizedType = PYTHON_ENDPOINTS[type] ? type : 'design';
    const endpoint = PYTHON_ENDPOINTS[normalizedType];

    let pythonResult: any = null;
    let pythonError: string | null = null;

    if (pythonService.isHealthy()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const pythonBody = buildPythonBody(normalizedType, { prompt, ...params });
        const resp = await fetch(`${PYTHON_API}${endpoint.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pythonBody),
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

    const resultData = endpoint.resultKey
      ? pythonResult?.[endpoint.resultKey] || FALLBACKS[normalizedType]({ ...params, prompt })
      : pythonResult?.analysis || FALLBACKS[normalizedType]({ ...params, prompt });

    const gen = await prisma.aIGeneration.create({
      data: {
        prompt,
        type,
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
