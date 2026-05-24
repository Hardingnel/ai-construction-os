import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const team = await prisma.teamMember.findMany({
      include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch team' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, role } = req.body;
    const member = await prisma.teamMember.create({
      data: { userId, role },
      include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
    });
    if (userId !== req.userId) {
      createNotification({ title: 'Team Invitation', message: `You've been added to the team as ${role}`, type: 'team', userId }).catch(() => {});
    }
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add team member' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const member = await prisma.teamMember.findUnique({ where: { id: req.params.id }, include: { user: { select: { id: true, name: true } } } });
    await prisma.teamMember.delete({ where: { id: req.params.id } });
    if (member && member.userId !== req.userId) {
      createNotification({ title: 'Team Removed', message: `You've been removed from the team`, type: 'warning', userId: member.userId }).catch(() => {});
    }
    res.json({ message: 'Team member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove team member' });
  }
});

export { router as teamRouter };
