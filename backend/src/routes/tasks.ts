import { Router, Response } from 'express';
import { prisma } from '../app';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = Router();

router.get('/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.projectId, project: { userId: req.userId } },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, assigneeId, projectId, dueDate } = req.body;
    const task = await prisma.task.create({
      data: { title, description, priority, assigneeId, projectId, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined },
    });
    if (assigneeId && assigneeId !== req.userId) {
      createNotification({ title: 'New Task Assigned', message: `You've been assigned: "${title}"`, type: 'task', link: `/tasks?projectId=${projectId}`, userId: assigneeId }).catch(() => {});
    } else {
      createNotification({ title: 'Task Created', message: `Task "${title}" created`, type: 'info', userId: req.userId! }).catch(() => {});
    }
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });
    if (req.body.status && existing && existing.status !== req.body.status) {
      createNotification({ title: 'Task Status Changed', message: `"${task.title}" is now ${req.body.status}`, type: 'info', link: `/tasks?projectId=${task.projectId}`, userId: req.userId! }).catch(() => {});
      if (task.assigneeId && task.assigneeId !== req.userId) {
        createNotification({ title: 'Task Updated', message: `"${task.title}" is now ${req.body.status}`, type: 'info', link: `/tasks?projectId=${task.projectId}`, userId: task.assigneeId }).catch(() => {});
      }
    }
    if (req.body.assigneeId && existing && existing.assigneeId !== req.body.assigneeId && req.body.assigneeId !== req.userId) {
      createNotification({ title: 'New Task Assigned', message: `You've been assigned: "${task.title}"`, type: 'task', link: `/tasks?projectId=${task.projectId}`, userId: req.body.assigneeId }).catch(() => {});
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

export { router as tasksRouter };
