import { Router, Request, Response } from 'express';
import { db } from '../services/db';
import { superAdminMiddleware } from '../middleware/admin';

const router = Router();
router.use(superAdminMiddleware);

router.get('/tenants', async (_req: Request, res: Response) => {
  try {
    const tenants = await db.tenant.findMany({
      include: {
        _count: { select: { projects: true, members: true, apiKeys: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, slug, domain } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'name and slug are required' });
    }
    const existing = await db.tenant.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ message: 'A tenant with this slug already exists' });
    }
    const tenant = await db.tenant.create({
      data: { name, slug, domain, settings: '{}' }
    });
    res.status(201).json(tenant);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const { name, slug, domain, isActive, settings } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) {
      const existing = await db.tenant.findUnique({ where: { slug } });
      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ message: 'Slug already taken' });
      }
      data.slug = slug;
    }
    if (domain !== undefined) data.domain = domain;
    if (isActive !== undefined) data.isActive = isActive;
    if (settings !== undefined) data.settings = settings;
    const tenant = await db.tenant.update({ where: { id: req.params.id }, data });
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/tenants/:id', async (req: Request, res: Response) => {
  try {
    await db.tenant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tenant deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { projects: true, members: true, apiKeys: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }
      }
    });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tenants/:id/users', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const membership = await db.tenantUser.create({
      data: { tenantId: req.params.id, userId, role: role || 'member' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });
    res.status(201).json(membership);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'User already a member' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/tenants/:tenantId/users/:userId', async (req: Request, res: Response) => {
  try {
    await db.tenantUser.delete({
      where: { tenantId_userId: { tenantId: req.params.tenantId, userId: req.params.userId } }
    });
    res.json({ message: 'User removed from tenant' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/api-keys', async (_req: Request, res: Response) => {
  try {
    const keys = await db.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
    const masked = keys.map((k: { keyValue: string }) => ({
      ...k,
      keyValue: k.keyValue.length > 12 ? k.keyValue.slice(0, 8) + '...' + k.keyValue.slice(-4) : k.keyValue
    }));
    res.json(masked);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/api-keys/:provider', async (req: Request, res: Response) => {
  try {
    const { keyValue, tenantId } = req.body;
    if (!keyValue) return res.status(400).json({ message: 'keyValue is required' });
    const data: any = { keyValue, isActive: true };
    if (tenantId) data.tenantId = tenantId;
    const existing = await db.apiKey.findFirst({ where: { provider: req.params.provider, tenantId: tenantId || null } });
    let key;
    if (existing) {
      key = await db.apiKey.update({ where: { id: existing.id }, data });
    } else {
      key = await db.apiKey.create({ data: { provider: req.params.provider, keyValue, tenantId: tenantId || null } });
    }
    res.json(key);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/api-keys/:provider/rotate', async (req: Request, res: Response) => {
  try {
    const { keyValue, tenantId } = req.body;
    if (!keyValue) return res.status(400).json({ message: 'keyValue is required' });
    const existing = await db.apiKey.findFirst({ where: { provider: req.params.provider, tenantId: tenantId || null } });
    if (existing) {
      await db.apiKey.update({ where: { id: existing.id }, data: { keyValue, isActive: true } });
    } else {
      await db.apiKey.create({ data: { provider: req.params.provider, keyValue, tenantId: tenantId || null } });
    }
    res.json({ message: `${req.params.provider} API key rotated` });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const [tenants, users, projects, apiKeys] = await Promise.all([
      db.tenant.count(),
      db.user.count(),
      db.project.count(),
      db.apiKey.count(),
    ]);
    let pythonStatus = 'unknown';
    try {
      const resp = await fetch('http://localhost:8000/health');
      if (resp.ok) {
        const data: any = await resp.json();
        pythonStatus = data.status || 'running';
      } else {
        pythonStatus = 'error';
      }
    } catch {
      pythonStatus = 'offline';
    }
    res.json({
      tenants,
      users,
      projects,
      apiKeys,
      pythonStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, company: true, createdAt: true, tenantId: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const validRoles = ['super_admin', 'admin', 'architect', 'engineer', 'qs', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }
    const user = await db.user.update({ where: { id: req.params.id }, data: { role } });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export { router as adminRouter };
