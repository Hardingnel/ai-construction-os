import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  createFloorPlan,
  getFloorPlans,
  getFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
  addElement,
  updateElement,
  deleteElement,
  deleteElementsByPlan,
  autoClassifyElements,
  detectClashes,
  quantityTakeoff,
  generateBIMAssistantResponse,
  ELEMENT_TYPES,
  ELEMENT_SUBTYPES,
  IFC_CLASSIFICATIONS,
  MATERIAL_TYPES,
} from '../services/bimService';

const router = Router();

router.get('/element-types', (_req, res: Response) => {
  res.json({ types: ELEMENT_TYPES, subtypes: ELEMENT_SUBTYPES, classifications: IFC_CLASSIFICATIONS, materials: MATERIAL_TYPES });
});

router.post('/floor-plans/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await createFloorPlan(req.params.projectId, req.userId!, req.body);
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/floor-plans/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plans = await getFloorPlans(req.params.projectId);
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/floor-plan/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await getFloorPlan(req.params.planId);
    if (!plan) return res.status(404).json({ message: 'Floor plan not found' });
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/floor-plan/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await updateFloorPlan(req.params.planId, req.body);
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/floor-plan/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await deleteFloorPlan(req.params.planId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/elements/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const element = await addElement(req.params.planId, req.body);
    res.status(201).json(element);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/element/:elementId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const element = await updateElement(req.params.elementId, req.body);
    res.json(element);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/element/:elementId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await deleteElement(req.params.elementId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/elements/batch-delete/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { elementIds } = req.body;
    await deleteElementsByPlan(req.params.planId, elementIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/classify/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await autoClassifyElements(req.params.planId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/clash/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const clashes = await detectClashes(req.params.planId);
    res.json({ total: clashes.length, clashes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/takeoff/:planId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const takeoff = await quantityTakeoff(req.params.planId);
    res.json(takeoff);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/assistant', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { query, floorPlanId } = req.body;
    if (!query) return res.status(400).json({ message: 'Query is required' });
    const result = await generateBIMAssistantResponse(query, floorPlanId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as bimRouter };
