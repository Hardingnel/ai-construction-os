import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db';

declare global {
  namespace Express {
    interface Request {
      tenant?: { id: string; name: string; slug: string };
    }
  }
}

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (tenantId) {
    try {
      const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, isActive: true } });
      if (tenant && tenant.isActive) {
        req.tenant = tenant;
      }
    } catch { }
  }
  next();
}

export async function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) {
    return res.status(400).json({ message: 'x-tenant-id header is required' });
  }
  next();
}
