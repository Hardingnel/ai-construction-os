import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma, db } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aicos-super-secret-jwt-key-change-in-production';

const signToken = (userId: string, role: string): string => {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign({ userId, role }, JWT_SECRET, options);
};

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Email, password, and name are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, password: hashedPassword, name, role: role || 'architect' },
    });
    const token = signToken(user.id, user.role);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, company: user.company, phone: user.phone },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
    res.status(401).json({ message: 'Session refresh not available' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, company: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const [projectCount, designCount] = await Promise.all([
      db.project.count({ where: { userId: user.id } }),
      db.design.count({ where: { userId: user.id } }),
    ]);
    res.json({ ...user, projectCount, designCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar, phone, company } = req.body;
    const user = await db.user.update({
      where: { id: req.userId },
      data: { name, avatar, phone, company },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, company: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: req.userId }, data: { password: hashedPassword } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as authRouter };
