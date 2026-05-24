import { prisma } from '../../app';

interface SyncPayload {
  action: 'create' | 'update' | 'delete';
  model: string;
  id: string;
  data?: any;
  userId: string;
  timestamp: string;
}

interface SyncConflict {
  id: string;
  model: string;
  localVersion: number;
  serverVersion: number;
  localData: any;
  serverData: any;
}

export class SyncService {
  async processSync(payload: SyncPayload) {
    const { action, model, id, data, userId } = payload;
    switch (model) {
      case 'project':
        return this.syncProject(action, id, data, userId);
      case 'design':
        return this.syncDesign(action, id, data, userId);
      case 'boqItem':
        return this.syncBOQItem(action, id, data, userId);
      case 'task':
        return this.syncTask(action, id, data, userId);
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  }

  private async syncProject(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return prisma.project.create({ data: { ...data, userId } });
      case 'update': {
        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) throw new Error('Project not found');
        if (data.version && existing.progress !== data.version) {
          return { conflict: true, serverData: existing, localData: data };
        }
        return prisma.project.update({ where: { id }, data });
      }
      case 'delete':
        return prisma.project.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async syncDesign(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return prisma.design.create({ data: { ...data, userId } });
      case 'update':
        return prisma.design.update({ where: { id }, data });
      case 'delete':
        return prisma.design.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async syncBOQItem(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return prisma.bOQItem.create({ data });
      case 'update':
        return prisma.bOQItem.update({ where: { id }, data });
      case 'delete':
        return prisma.bOQItem.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async syncTask(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return prisma.task.create({ data: { ...data, assigneeId: userId } });
      case 'update':
        return prisma.task.update({ where: { id }, data });
      case 'delete':
        return prisma.task.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async resolveConflict(conflict: SyncConflict) {
    const { model, id, serverData } = conflict;
    switch (model) {
      case 'project':
        return prisma.project.update({ where: { id }, data: serverData });
      default:
        throw new Error(`Unknown model for conflict resolution: ${model}`);
    }
  }

  async getSyncSnapshot(userId: string, lastSync?: string) {
    const where = lastSync ? { userId, updatedAt: { gte: new Date(lastSync) } } : { userId };
    const [projects, designs, tasks] = await Promise.all([
      prisma.project.findMany({ where, include: { boqItems: true, designs: true, tasks: true } }),
      prisma.design.findMany({ where: { project: { userId } } }),
      prisma.task.findMany({ where: { project: { userId } } }),
    ]);
    return { projects, designs, tasks, timestamp: new Date().toISOString() };
  }
}

export const syncService = new SyncService();
