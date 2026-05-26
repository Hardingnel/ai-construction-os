import { Router, Response } from 'express';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { type, search } = req.query;
    const where: any = { published: true };
    if (type) where.type = type;
    if (search) where.name = { contains: search as string };
    const plans = await db.marketplacePlan.findMany({
      where,
      orderBy: { sales: 'desc' },
      take: 50,
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const { type, search } = req.query;
    const where: any = { published: true };
    if (type) where.type = type;
    if (search) where.name = { contains: search as string };
    const plans = await db.marketplacePlan.findMany({
      where,
      orderBy: { sales: 'desc' },
      take: 50,
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/plans', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await db.marketplacePlan.create({
      data: { ...req.body, authorId: req.userId! },
    });
    createNotification({ title: 'Plan Published', message: `"${plan.name}" is now available on the marketplace`, type: 'success', link: `/marketplace`, userId: req.userId! }).catch(() => {});
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/professionals', async (req, res) => {
  try {
    const members = await db.teamMember.findMany({
      where: { status: 'active' },
      include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
    });
    res.json(members.map((m: any) => ({
      id: m.user.id,
      name: m.user.name,
      role: m.role,
      specialty: m.specialty,
      hourlyRate: m.hourlyRate,
      avatar: m.user.avatar,
      rating: 4.5 + Math.random() * 0.5,
      projects: Math.floor(Math.random() * 100) + 20,
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: 'Plan ID is required' });
    const plan = await db.marketplacePlan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    if (!plan.published) return res.status(400).json({ message: 'Plan is not available' });
    const order = await db.order.create({
      data: {
        userId: req.userId!,
        total: plan.price,
        status: 'completed',
        items: { create: { planId: plan.id, price: plan.price } },
      },
      include: { items: { include: { plan: true } } },
    });
    await db.marketplacePlan.update({
      where: { id: planId },
      data: { sales: { increment: 1 } },
    });
    createNotification({ title: 'Order Placed', message: `Purchased "${plan.name}" for $${plan.price.toFixed(2)}`, type: 'success', link: `/marketplace/orders`, userId: req.userId! }).catch(() => {});
    if (plan.authorId !== req.userId) {
      createNotification({ title: 'Plan Sold', message: `Your plan "${plan.name}" was purchased`, type: 'success', userId: plan.authorId }).catch(() => {});
    }
    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await db.order.findMany({
      where: { userId: req.userId! },
      include: { items: { include: { plan: { include: { author: { select: { id: true, name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as marketplaceRouter };
