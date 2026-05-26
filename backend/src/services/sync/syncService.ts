import { prisma, db } from '../../app';

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
        return db.project.create({ data: { ...data, userId } });
      case 'update': {
        const existing = await db.project.findUnique({ where: { id } });
        if (!existing) throw new Error('Project not found');
        if (data.version && existing.progress !== data.version) {
          return { conflict: true, serverData: existing, localData: data };
        }
        return db.project.update({ where: { id }, data });
      }
      case 'delete':
        return db.project.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async syncDesign(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return db.design.create({ data: { ...data, userId } });
      case 'update':
        return db.design.update({ where: { id }, data });
      case 'delete':
        return db.design.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async syncBOQItem(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return db.bOQItem.create({ data });
      case 'update':
        return db.bOQItem.update({ where: { id }, data });
      case 'delete':
        return db.bOQItem.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async syncTask(action: string, id: string, data: any, userId: string) {
    switch (action) {
      case 'create':
        return db.task.create({ data: { ...data, assigneeId: userId } });
      case 'update':
        return db.task.update({ where: { id }, data });
      case 'delete':
        return db.task.delete({ where: { id } });
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async resolveConflict(conflict: SyncConflict) {
    const { model, id, serverData } = conflict;
    switch (model) {
      case 'project':
        return db.project.update({ where: { id }, data: serverData });
      default:
        throw new Error(`Unknown model for conflict resolution: ${model}`);
    }
  }

  async getSyncSnapshot(userId: string, lastSync?: string) {
    const where = lastSync ? { userId, updatedAt: { gte: new Date(lastSync) } } : { userId };
    const [projects, designs, tasks] = await Promise.all([
      db.project.findMany({ where, include: { boqItems: true, designs: true, tasks: true } }),
      db.design.findMany({ where: { project: { userId } } }),
      db.task.findMany({ where: { project: { userId } } }),
    ]);
    return { projects, designs, tasks, timestamp: new Date().toISOString() };
  }
}

export const syncService = new SyncService();
