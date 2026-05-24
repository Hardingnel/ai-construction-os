import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const password = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aicos.com' },
    update: {},
    create: { email: 'admin@aicos.com', password, name: 'Admin User', role: 'admin', company: 'AI COS' },
  });
  const architect = await prisma.user.upsert({
    where: { email: 'architect@aicos.com' },
    update: {},
    create: { email: 'architect@aicos.com', password, name: 'Sarah Johnson', role: 'architect', company: 'DesignPro Ltd' },
  });
  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@aicos.com' },
    update: {},
    create: { email: 'engineer@aicos.com', password, name: 'Michael Chen', role: 'engineer', company: 'StructEng Inc' },
  });
  const qs = await prisma.user.upsert({
    where: { email: 'qs@aicos.com' },
    update: {},
    create: { email: 'qs@aicos.com', password, name: 'David Thompson', role: 'qs', company: 'CostSolve' },
  });

  await prisma.teamMember.createMany({
    data: [
      { userId: admin.id, role: 'Project Manager', specialty: 'Management', hourlyRate: 110 },
      { userId: architect.id, role: 'Lead Architect', specialty: 'Residential Design', hourlyRate: 85 },
      { userId: engineer.id, role: 'Structural Engineer', specialty: 'Structural Analysis', hourlyRate: 95 },
      { userId: qs.id, role: 'Quantity Surveyor', specialty: 'Cost Estimation', hourlyRate: 75 },
    ],
  });

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Modern Villa - Freetown', description: 'A modern 4-bedroom duplex with African roofing, smart home features, and flood-resistant foundation suitable for Sierra Leone weather conditions.',
        type: 'Residential', status: 'active', location: 'Freetown, Sierra Leone', budget: 450000, area: 350, floors: 2, bedrooms: 4, style: 'African Contemporary', progress: 65, userId: admin.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Commercial Complex - Bo', description: 'Mixed-use commercial development with retail spaces, offices, and underground parking.', type: 'Commercial', status: 'active', location: 'Bo, Sierra Leone', budget: 2200000, area: 1200, floors: 4, style: 'Modern', progress: 35, userId: architect.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Eco Resort - Tokeh Beach', description: 'Sustainable beach resort with villas, pool, restaurant, and tropical landscaping.', type: 'Residential', status: 'active', location: 'Tokeh, Sierra Leone', budget: 5100000, area: 2500, floors: 2, style: 'Tropical Modern', progress: 15, userId: engineer.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'School Infrastructure Project', description: 'Primary school with 12 classrooms, library, computer lab, and sports facilities.', type: 'Institutional', status: 'draft', location: 'Makeni, Sierra Leone', budget: 850000, area: 800, floors: 2, style: 'Sustainable/Green', progress: 10, userId: admin.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Hospital Wing Expansion', description: 'Expansion of existing hospital with new ward, operating theater, and emergency department.', type: 'Institutional', status: 'active', location: 'Freetown, Sierra Leone', budget: 4800000, area: 1500, floors: 3, style: 'Modern', progress: 80, userId: architect.id,
      },
    }),
  ]);

  for (const project of projects) {
    const boqItems = [
      { name: 'Concrete (Grade 30)', unit: 'm³', qty: Math.round(project.area! * 0.3), rate: 185, cat: 'Structure' },
      { name: 'Steel Reinforcement', unit: 'tonnes', qty: Math.round(project.area! * 0.02), rate: 1200, cat: 'Structure' },
      { name: 'Cement (Portland)', unit: 'bags', qty: Math.round(project.area! * 2), rate: 8.5, cat: 'Materials' },
      { name: 'Sand (Sharp)', unit: 'm³', qty: Math.round(project.area! * 0.5), rate: 35, cat: 'Materials' },
      { name: 'Granite Aggregate', unit: 'm³', qty: Math.round(project.area! * 0.4), rate: 45, cat: 'Materials' },
      { name: 'Clay Bricks', unit: 'pcs', qty: Math.round(project.area! * 15), rate: 0.35, cat: 'Masonry' },
      { name: 'Roofing Sheets', unit: 'm²', qty: Math.round(project.area! * 0.8), rate: 22, cat: 'Roofing' },
      { name: 'Labor - Mason', unit: 'days', qty: Math.round(project.area! * 0.3), rate: 45, cat: 'Labor' },
      { name: 'Labor - Carpenter', unit: 'days', qty: Math.round(project.area! * 0.2), rate: 45, cat: 'Labor' },
      { name: 'Equipment Rental', unit: 'days', qty: Math.round(project.area! * 0.15), rate: 250, cat: 'Equipment' },
    ];
    await prisma.bOQItem.createMany({
      data: boqItems.map(i => ({
        code: i.name,
        description: i.name,
        unit: i.unit,
        quantity: i.qty,
        unitRate: i.rate,
        total: i.qty * i.rate,
        category: i.cat,
        projectId: project.id,
      })),
    });

    await prisma.task.createMany({
      data: [
        { title: 'Site Survey & Analysis', status: 'completed', priority: 'high', projectId: project.id, assigneeId: engineer.id, dueDate: new Date(Date.now() + 7 * 86400000).toISOString() },
        { title: 'Foundation Design', status: 'in_progress', priority: 'high', projectId: project.id, assigneeId: architect.id, dueDate: new Date(Date.now() + 14 * 86400000).toISOString() },
        { title: 'Structural Calculations', status: 'todo', priority: 'high', projectId: project.id, assigneeId: engineer.id, dueDate: new Date(Date.now() + 21 * 86400000).toISOString() },
        { title: 'BOQ Preparation', status: 'todo', priority: 'medium', projectId: project.id, assigneeId: qs.id, dueDate: new Date(Date.now() + 28 * 86400000).toISOString() },
        { title: 'Permit Applications', status: 'todo', priority: 'medium', projectId: project.id, dueDate: new Date(Date.now() + 35 * 86400000).toISOString() },
        { title: 'Foundation Excavation', status: 'todo', priority: 'high', projectId: project.id, dueDate: new Date(Date.now() + 42 * 86400000).toISOString() },
        { title: 'Superstructure Construction', status: 'todo', priority: 'medium', projectId: project.id, dueDate: new Date(Date.now() + 70 * 86400000).toISOString() },
        { title: 'MEP Installation', status: 'todo', priority: 'medium', projectId: project.id, dueDate: new Date(Date.now() + 90 * 86400000).toISOString() },
      ],
    });

    await prisma.phase.createMany({
      data: [
        { name: 'Design & Planning', description: 'Architectural design, structural analysis, and project planning', order: 1, status: 'in_progress', projectId: project.id },
        { name: 'Foundation Works', description: 'Site preparation, excavation, and foundation construction', order: 2, status: 'pending', projectId: project.id },
        { name: 'Superstructure', description: 'Column, beam, and slab construction', order: 3, status: 'pending', projectId: project.id },
        { name: 'Finishing', description: 'Plastering, tiling, painting, and interior works', order: 4, status: 'pending', projectId: project.id },
        { name: 'MEP', description: 'Mechanical, electrical, and plumbing installation', order: 5, status: 'pending', projectId: project.id },
        { name: 'Handover', description: 'Final inspection, documentation, and project handover', order: 6, status: 'pending', projectId: project.id },
      ],
    });

    await prisma.expense.createMany({
      data: [
        { description: 'Site Survey', amount: 2500, category: 'Consultancy', date: new Date(Date.now() - 30 * 86400000).toISOString(), projectId: project.id },
        { description: 'Soil Testing', amount: 1800, category: 'Testing', date: new Date(Date.now() - 25 * 86400000).toISOString(), projectId: project.id },
        { description: 'Preliminary Materials', amount: 15000, category: 'Materials', date: new Date(Date.now() - 20 * 86400000).toISOString(), projectId: project.id },
      ],
    });
  }

  await prisma.marketplacePlan.createMany({
    data: [
      { name: 'Modern 4-Bed Villa', description: 'Complete architectural plans for a modern 4-bedroom villa', price: 249, type: 'Residential', authorId: admin.id, rating: 4.8, sales: 342, published: true },
      { name: 'Commercial Office Complex', description: 'Comprehensive plans for a 4-story commercial building', price: 599, type: 'Commercial', authorId: architect.id, rating: 4.6, sales: 128, published: true },
      { name: 'Sustainable School Design', description: 'Eco-friendly school design with 12 classrooms', price: 399, type: 'Institutional', authorId: engineer.id, rating: 4.9, sales: 87, published: true },
      { name: 'Luxury Beach Villa', description: 'Premium beachfront villa with infinity pool', price: 449, type: 'Residential', authorId: admin.id, rating: 4.7, sales: 215, published: true },
      { name: 'Bridge Structural Plans', description: 'Complete structural engineering plans for a 50m bridge', price: 999, type: 'Infrastructure', authorId: engineer.id, rating: 4.4, sales: 43, published: true },
      { name: 'Hospital Wing Blueprint', description: 'Medical facility expansion plans with 3 floors', price: 799, type: 'Institutional', authorId: architect.id, rating: 4.5, sales: 56, published: true },
    ],
  });

  await prisma.gISData.createMany({
    data: [
      { latitude: 8.4844, longitude: -13.2299, elevation: 42, floodRisk: 'low', soilType: 'Lateritic', projectId: projects[0].id },
      { latitude: 7.9561, longitude: -11.7386, elevation: 15, floodRisk: 'medium', soilType: 'Alluvial', projectId: projects[1].id },
    ],
  });

  console.log('Seeding complete!');
  console.log(`Created: ${await prisma.user.count()} users, ${await prisma.project.count()} projects, ${await prisma.bOQItem.count()} BOQ items, ${await prisma.task.count()} tasks, ${await prisma.phase.count()} phases, ${await prisma.expense.count()} expenses, ${await prisma.marketplacePlan.count()} marketplace plans`);
  console.log('Login: admin@aicos.com / password123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
