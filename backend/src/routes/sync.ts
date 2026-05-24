import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { syncService } from '../services/sync/syncService';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await syncService.processSync({ ...req.body, userId: req.userId! });
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error: any) {
    if (error.conflict) {
      return res.status(409).json({ success: false, conflict: true, serverData: error.serverData, localData: error.localData });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/resolve-conflict', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await syncService.resolveConflict(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/snapshot', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lastSync } = req.body;
    const snapshot = await syncService.getSyncSnapshot(req.userId!, lastSync);
    res.json(snapshot);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/batch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { operations } = req.body;
    const results = await Promise.allSettled(
      operations.map((op: any) => syncService.processSync({ ...op, userId: req.userId! }))
    );
    res.json({
      success: true,
      results: results.map((r) =>
        r.status === 'fulfilled' ? { success: true, data: r.value } : { success: false, error: r.reason.message }
      ),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export { router as syncRouter };
