import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aicos-dev-secret-key-2024';

interface JwtPayload {
  userId: string;
  role: string;
}

export async function superAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: super_admin role required' });
    }
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
