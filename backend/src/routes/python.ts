import { Router, Response } from 'express';
import { pythonService } from '../services/pythonServiceManager';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/status', (_req, res) => {
  const state = pythonService.state;
  const healthy = pythonService.isHealthy();
  res.json({
    available: healthy,
    status: state.status,
    pid: state.pid,
    healthy: state.healthy,
    uptime: state.uptime,
    retryCount: state.retryCount,
    lastError: state.lastError,
    lastHealthCheck: state.lastHealthCheck,
  });
});

router.post('/restart', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pythonService.stop();
    await pythonService.start();
    res.json({ message: 'Python service restarted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export { router as pythonRouter };
