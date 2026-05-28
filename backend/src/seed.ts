import { db } from './services/db';
import { prisma } from './services/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');
  const password = await bcrypt.hash('password123', 12);

  const superAdmin = await db.user.upsert({
    where: { email: 'admin@aicos.com' },
    update: { role: 'super_admin', name: 'Super Admin', password },
    create: { email: 'admin@aicos.com', password, name: 'Super Admin', role: 'super_admin', company: 'AI COS' },
  });

  const tenants = await Promise.all([
    db.tenant.upsert({
      where: { slug: 'skyline-architects' },
      update: {},
      create: { name: 'Skyline Architects', slug: 'skyline-architects', domain: 'skyline.example.com', settings: '{}' },
    }),
    db.tenant.upsert({
      where: { slug: 'greenbuild-engineering' },
      update: {},
      create: { name: 'GreenBuild Engineering', slug: 'greenbuild-engineering', domain: 'greenbuild.example.com', settings: '{}' },
    }),
    db.tenant.upsert({
      where: { slug: 'urbancore-design' },
      update: {},
      create: { name: 'UrbanCore Design Studio', slug: 'urbancore-design', domain: 'urbancore.example.com', settings: '{}' },
    }),
    db.tenant.upsert({
      where: { slug: 'coastal-development' },
      update: {},
      create: { name: 'Coastal Development Corp', slug: 'coastal-development', domain: 'coastal.example.com', settings: '{}' },
    }),
    db.tenant.upsert({
      where: { slug: 'mountainview-construction' },
      update: {},
      create: { name: 'MountainView Construction', slug: 'mountainview-construction', domain: 'mountainview.example.com', settings: '{}' },
    }),
  ]);

  const seededUsers = [
    { email: 'architect@aicos.com', name: 'Sarah Johnson', role: 'architect', company: 'Skyline Architects', tenantIdx: 0 },
    { email: 'engineer@aicos.com', name: 'Michael Chen', role: 'engineer', company: 'GreenBuild Engineering', tenantIdx: 1 },
    { email: 'qs@aicos.com', name: 'David Thompson', role: 'qs', company: 'UrbanCore Design Studio', tenantIdx: 2 },
  ];
  const users: any[] = [superAdmin];
  for (const u of seededUsers) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: { tenantId: tenants[u.tenantIdx].id },
      create: { email: u.email, password, name: u.name, role: u.role, company: u.company, tenantId: tenants[u.tenantIdx].id },
    });
    users.push(user);
  }
  await db.user.update({ where: { id: superAdmin.id }, data: { tenantId: tenants[0].id } });

  for (const tenant of tenants) {
    await db.tenantUser.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: superAdmin.id } }, update: {}, create: { tenantId: tenant.id, userId: superAdmin.id, role: 'admin' } });
  }
  for (let i = 0; i < seededUsers.length; i++) {
    const u = users[i + 1];
    await db.tenantUser.upsert({ where: { tenantId_userId: { tenantId: tenants[seededUsers[i].tenantIdx].id, userId: u.id } }, update: {}, create: { tenantId: tenants[seededUsers[i].tenantIdx].id, userId: u.id, role: 'admin' } });
  }

  const projectDefs: { name: string; desc: string; type: string; loc: string; budget: number; area: number; floors: number; bed: number; style: string; progress: number; userIdx: number; tenantIdx: number }[] = [
    { name: 'Modern Villa - Freetown', desc: '4-bedroom duplex with African roofing, smart home features, flood-resistant foundation.', type: 'Residential', loc: 'Freetown, Sierra Leone', budget: 450000, area: 350, floors: 2, bed: 4, style: 'African Contemporary', progress: 65, userIdx: 1, tenantIdx: 0 },
    { name: 'Commercial Complex - Bo', desc: 'Mixed-use development with retail, offices, and underground parking.', type: 'Commercial', loc: 'Bo, Sierra Leone', budget: 2200000, area: 1200, floors: 4, bed: 0, style: 'Modern', progress: 35, userIdx: 1, tenantIdx: 0 },
    { name: 'Eco Resort - Tokeh Beach', desc: 'Sustainable beach resort with villas, pool, restaurant, tropical landscaping.', type: 'Residential', loc: 'Tokeh, Sierra Leone', budget: 5100000, area: 2500, floors: 2, bed: 6, style: 'Tropical Modern', progress: 15, userIdx: 2, tenantIdx: 1 },
    { name: 'Bridge Structural Analysis', desc: '50-meter steel bridge with seismic dampers and flood-resistant piers.', type: 'Infrastructure', loc: 'Kenema, Sierra Leone', budget: 3800000, area: 600, floors: 0, bed: 0, style: 'Modern', progress: 45, userIdx: 2, tenantIdx: 1 },
    { name: 'School Infrastructure - Makeni', desc: 'Primary school with 12 classrooms, library, computer lab, sports facilities.', type: 'Institutional', loc: 'Makeni, Sierra Leone', budget: 850000, area: 800, floors: 2, bed: 0, style: 'Sustainable/Green', progress: 10, userIdx: 3, tenantIdx: 2 },
    { name: 'Hospital Wing Expansion', desc: 'Hospital expansion with new ward, operating theater, emergency department.', type: 'Institutional', loc: 'Freetown', budget: 4800000, area: 1500, floors: 3, bed: 0, style: 'Modern', progress: 80, userIdx: 3, tenantIdx: 2 },
    { name: 'Luxury Apartment Tower', desc: '20-story luxury apartment tower with ocean view, pool, gym, and retail podium.', type: 'Commercial', loc: 'Lagos, Nigeria', budget: 12500000, area: 8000, floors: 20, bed: 0, style: 'Contemporary High-Rise', progress: 5, userIdx: 0, tenantIdx: 3 },
    { name: 'Seaside Boardwalk', desc: '1.5km public boardwalk with restaurants, shops, viewing decks, and landscaping.', type: 'Infrastructure', loc: 'Accra, Ghana', budget: 4200000, area: 3000, floors: 1, bed: 0, style: 'Modern Coastal', progress: 60, userIdx: 0, tenantIdx: 3 },
    { name: 'Mountain Lodge Retreat', desc: 'Eco-lodge with 12 cabins, main lodge, restaurant, and nature trails in highlands.', type: 'Residential', loc: 'Mount Kenya, Kenya', budget: 2800000, area: 1800, floors: 2, bed: 24, style: 'Rustic Modern', progress: 25, userIdx: 0, tenantIdx: 4 },
    { name: 'Dam Construction Project', desc: 'Hydroelectric dam with 50MW capacity, spillway, fish ladder, and irrigation canals.', type: 'Infrastructure', loc: 'Tana River, Kenya', budget: 45000000, area: 5000, floors: 0, bed: 0, style: 'Industrial', progress: 40, userIdx: 0, tenantIdx: 4 },
  ];

  for (const pd of projectDefs) {
    const project = await db.project.create({
      data: {
        name: pd.name, description: pd.desc, type: pd.type, status: 'active', location: pd.loc,
        budget: pd.budget, area: pd.area, floors: pd.floors, bedrooms: pd.bed, style: pd.style,
        progress: pd.progress, userId: users[pd.userIdx].id, tenantId: tenants[pd.tenantIdx].id,
      },
    });

    const boqItems = [
      { name: 'Concrete (Grade 30)', unit: 'm³', rate: 185, cat: 'Structure' },
      { name: 'Steel Reinforcement', unit: 'tonnes', rate: 1200, cat: 'Structure' },
      { name: 'Cement (Portland)', unit: 'bags', rate: 8.5, cat: 'Materials' },
      { name: 'Sand (Sharp)', unit: 'm³', rate: 35, cat: 'Materials' },
      { name: 'Granite Aggregate', unit: 'm³', rate: 45, cat: 'Materials' },
      { name: 'Clay Bricks', unit: 'pcs', rate: 0.35, cat: 'Masonry' },
      { name: 'Roofing Sheets', unit: 'm²', rate: 22, cat: 'Roofing' },
      { name: 'Labor - Mason', unit: 'days', rate: 45, cat: 'Labor' },
      { name: 'Labor - Carpenter', unit: 'days', rate: 45, cat: 'Labor' },
      { name: 'Equipment Rental', unit: 'days', rate: 250, cat: 'Equipment' },
    ];
    const area = pd.area || 500;
    await db.bOQItem.createMany({
      data: boqItems.map(i => ({
        code: i.name, description: i.name, unit: i.unit,
        quantity: Math.round(area * (i.cat === 'Structure' ? 0.3 : i.cat === 'Materials' ? 1 : i.cat === 'Masonry' ? 15 : 0.2)),
        unitRate: i.rate, total: Math.round(area * (i.cat === 'Structure' ? 0.3 : i.cat === 'Materials' ? 1 : i.cat === 'Masonry' ? 15 : 0.2) * i.rate),
        category: i.cat, projectId: project.id,
      })),
    });

    await db.task.createMany({
      data: [
        { title: 'Site Survey & Analysis', status: 'completed', priority: 'high', projectId: project.id, assigneeId: users[pd.userIdx].id, dueDate: new Date(Date.now() + 7 * 86400000).toISOString() },
        { title: 'Foundation Design', status: 'in_progress', priority: 'high', projectId: project.id, assigneeId: users[1].id, dueDate: new Date(Date.now() + 14 * 86400000).toISOString() },
        { title: 'Structural Calculations', status: 'todo', priority: 'high', projectId: project.id, assigneeId: users[2].id, dueDate: new Date(Date.now() + 21 * 86400000).toISOString() },
        { title: 'BOQ Preparation', status: 'todo', priority: 'medium', projectId: project.id, assigneeId: users[3].id, dueDate: new Date(Date.now() + 28 * 86400000).toISOString() },
        { title: 'Permit Applications', status: 'todo', priority: 'medium', projectId: project.id, dueDate: new Date(Date.now() + 35 * 86400000).toISOString() },
        { title: 'Foundation Excavation', status: 'todo', priority: 'high', projectId: project.id, dueDate: new Date(Date.now() + 42 * 86400000).toISOString() },
        { title: 'Superstructure Construction', status: 'todo', priority: 'medium', projectId: project.id, dueDate: new Date(Date.now() + 70 * 86400000).toISOString() },
        { title: 'MEP Installation', status: 'todo', priority: 'medium', projectId: project.id, dueDate: new Date(Date.now() + 90 * 86400000).toISOString() },
      ],
    });

    await db.phase.createMany({
      data: [
        { name: 'Design & Planning', description: 'Architectural design, structural analysis, and project planning', order: 1, status: 'in_progress', projectId: project.id },
        { name: 'Foundation Works', description: 'Site preparation, excavation, and foundation construction', order: 2, status: 'pending', projectId: project.id },
        { name: 'Superstructure', description: 'Column, beam, and slab construction', order: 3, status: 'pending', projectId: project.id },
        { name: 'Finishing', description: 'Plastering, tiling, painting, and interior works', order: 4, status: 'pending', projectId: project.id },
        { name: 'MEP', description: 'Mechanical, electrical, and plumbing installation', order: 5, status: 'pending', projectId: project.id },
        { name: 'Handover', description: 'Final inspection, documentation, and project handover', order: 6, status: 'pending', projectId: project.id },
      ],
    });

    await db.expense.createMany({
      data: [
        { description: 'Site Survey', amount: 2500, category: 'Consultancy', date: new Date(Date.now() - 30 * 86400000).toISOString(), projectId: project.id },
        { description: 'Soil Testing', amount: 1800, category: 'Testing', date: new Date(Date.now() - 25 * 86400000).toISOString(), projectId: project.id },
        { description: 'Preliminary Materials', amount: 15000, category: 'Materials', date: new Date(Date.now() - 20 * 86400000).toISOString(), projectId: project.id },
      ],
    });
  }

  await db.marketplacePlan.createMany({
    data: [
      { name: 'Modern 4-Bed Villa', description: 'Complete architectural plans for a modern 4-bedroom villa', price: 249, type: 'Residential', authorId: users[1].id, rating: 4.8, sales: 342, published: true },
      { name: 'Commercial Office Complex', description: 'Comprehensive plans for a 4-story commercial building', price: 599, type: 'Commercial', authorId: users[1].id, rating: 4.6, sales: 128, published: true },
      { name: 'Sustainable School Design', description: 'Eco-friendly school design with 12 classrooms', price: 399, type: 'Institutional', authorId: users[2].id, rating: 4.9, sales: 87, published: true },
      { name: 'Luxury Beach Villa', description: 'Premium beachfront villa with infinity pool', price: 449, type: 'Residential', authorId: users[0].id, rating: 4.7, sales: 215, published: true },
      { name: 'Bridge Structural Plans', description: 'Complete structural engineering plans for a 50m bridge', price: 999, type: 'Infrastructure', authorId: users[2].id, rating: 4.4, sales: 43, published: true },
      { name: 'Hospital Wing Blueprint', description: 'Medical facility expansion plans with 3 floors', price: 799, type: 'Institutional', authorId: users[3].id, rating: 4.5, sales: 56, published: true },
    ],
  });

  await db.gISData.createMany({
    data: [
      { latitude: 8.4844, longitude: -13.2299, elevation: 42, floodRisk: 'low', soilType: 'Lateritic' },
      { latitude: 7.9561, longitude: -11.7386, elevation: 15, floodRisk: 'medium', soilType: 'Alluvial' },
    ],
  });

  console.log('Seeding complete!');
  console.log(`Created: ${await db.user.count()} users, ${await db.tenant.count()} tenants, ${await db.project.count()} projects, ${await db.bOQItem.count()} BOQ items, ${await db.task.count()} tasks, ${await db.phase.count()} phases`);
  console.log('Super Admin: admin@aicos.com / password123');
  console.log('Tenants: Skyline Architects, GreenBuild Engineering, UrbanCore Design, Coastal Development Corp, MountainView Construction');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
