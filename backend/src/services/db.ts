import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const prisma = new PrismaClient();

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || 'https://rwvhjyvqdydrpcwsglbz.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required for fallback');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

const modelToTable: Record<string, string> = {
  user: 'User',
  project: 'Project',
  design: 'Design',
  gISData: 'GISData',
  bOQItem: 'BOQItem',
  task: 'Task',
  phase: 'Phase',
  expense: 'Expense',
  document: 'Document',
  teamMember: 'TeamMember',
  comment: 'Comment',
  aIGeneration: 'AIGeneration',
  marketplacePlan: 'MarketplacePlan',
  order: 'Order',
  orderItem: 'OrderItem',
  auditLog: 'AuditLog',
  buildingCode: 'BuildingCode',
  complianceCheck: 'ComplianceCheck',
  complianceCheckResult: 'ComplianceCheckResult',
  sustainabilityAssessment: 'SustainabilityAssessment',
  tutorSession: 'TutorSession',
  tutorMessage: 'TutorMessage',
  glossaryEntry: 'GlossaryEntry',
  projectPhase: 'ProjectPhase',
  projectMilestone: 'ProjectMilestone',
  importExportJob: 'ImportExportJob',
  conversionRecord: 'ConversionRecord',
  bIMFloorPlan: 'BIMFloorPlan',
  notification: 'Notification',
  bIMElement: 'BIMElement',
};

function applyWhere(q: any, where: Record<string, any>) {
  for (const [key, val] of Object.entries(where)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const op = val as Record<string, any>;
      if (op.equals !== undefined) q = q.eq(key, op.equals);
      else if (op.not !== undefined) q = q.neq(key, op.not);
      else if (op.in !== undefined) q = q.in(key, op.in);
      else if (op.notIn !== undefined) q = q.not.in(key, op.notIn);
      else if (op.lt !== undefined) q = q.lt(key, op.lt);
      else if (op.lte !== undefined) q = q.lte(key, op.lte);
      else if (op.gt !== undefined) q = q.gt(key, op.gt);
      else if (op.gte !== undefined) q = q.gte(key, op.gte);
      else if (op.contains !== undefined) q = q.ilike(key, `%${op.contains}%`);
      else if (op.startsWith !== undefined) q = q.ilike(key, `${op.startsWith}%`);
      else if (op.endsWith !== undefined) q = q.ilike(key, `%${op.endsWith}`);
    } else {
      q = q.eq(key, val);
    }
  }
  return q;
}

function applyOrderBy(q: any, orderBy: any) {
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const ob of entries) {
    const [field, dir] = [Object.keys(ob)[0], Object.values(ob)[0]];
    q = q.order(field, { ascending: dir === 'asc' });
  }
  return q;
}

async function executeFallback(model: string, method: string, args: any) {
  const table = modelToTable[model];
  if (!table) throw new Error(`Unknown model: ${model}`);
  const supabase = getSupabase();
  const base = supabase.from(table);

  if (method === 'findUnique') {
    let q: any = base.select(args?.select || '*');
    if (args?.where) q = applyWhere(q, args.where);
    if (args?.orderBy) q = applyOrderBy(q, args.orderBy);
    q = q.single();
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  if (method === 'findFirst') {
    let q: any = base.select(args?.select || '*');
    if (args?.where) q = applyWhere(q, args.where);
    if (args?.orderBy) q = applyOrderBy(q, args.orderBy);
    q = q.limit(1);
    const { data, error } = await q;
    if (error) throw error;
    return data?.[0] ?? null;
  }

  if (method === 'findMany') {
    let q: any = base.select(args?.select || '*');
    if (args?.where) q = applyWhere(q, args.where);
    if (args?.orderBy) q = applyOrderBy(q, args.orderBy);
    if (args?.skip) q = q.range(args.skip, args.skip + (args.take || 10) - 1);
    else if (args?.take) q = q.limit(args.take);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  if (method === 'create') {
    const q: any = base.insert(args.data).select(args?.select || '*');
    const { data, error } = await q.single();
    if (error) throw error;
    return data;
  }

  if (method === 'createMany') {
    const { data, error } = await base.insert(args.data);
    if (error) throw error;
    return data;
  }

  if (method === 'update') {
    let q: any = base.update(args.data);
    if (args?.where) q = applyWhere(q, args.where);
    q = q.select(args?.select || '*');
    const { data, error } = await q.single();
    if (error) throw error;
    return data;
  }

  if (method === 'updateMany') {
    let q: any = base.update(args.data);
    if (args?.where) q = applyWhere(q, args.where);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  if (method === 'delete') {
    let q: any = base.delete();
    if (args?.where) q = applyWhere(q, args.where);
    const { data, error } = await q.select().single();
    if (error) throw error;
    return data;
  }

  if (method === 'deleteMany') {
    let q: any = base.delete();
    if (args?.where) q = applyWhere(q, args.where);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  if (method === 'count') {
    let q: any = getSupabase().from(table).select('*', { count: 'exact', head: true });
    if (args?.where) q = applyWhere(q, args.where);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  }

  throw new Error(`Unsupported Supabase fallback method: ${method}`);
}

export const db = new Proxy({} as Record<string, Record<string, Function>>, {
  get(_target, model: string) {
    return new Proxy({} as Record<string, Function>, {
      get(_t, method: string) {
        return async (args?: any) => {
          try {
            return await (prisma as any)[model][method](args);
          } catch (err: any) {
            console.warn(`[DB Fallback] prisma.${model}.${method} failed: ${err.message}. Falling back to Supabase.`);
            return await executeFallback(model, method, args);
          }
        };
      },
    });
  },
});
