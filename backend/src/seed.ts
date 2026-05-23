import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aicos.com' },
    update: {},
    create: {
      email: 'admin@aicos.com',
      password,
      name: 'Admin User',
      role: 'admin',
    },
  });

  const architect = await prisma.user.upsert({
    where: { email: 'architect@aicos.com' },
    update: {},
    create: {
      email: 'architect@aicos.com',
      password,
      name: 'Sarah Johnson',
      role: 'architect',
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@aicos.com' },
    update: {},
    create: {
      email: 'engineer@aicos.com',
      password,
      name: 'Michael Chen',
      role: 'engineer',
    },
  });

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Modern Villa - Freetown',
        description: 'A modern 4-bedroom duplex with African roofing and smart home features',
        type: 'Residential',
        status: 'active',
        location: 'Freetown, Sierra Leone',
        budget: 450000,
        area: 350,
        floors: 2,
        bedrooms: 4,
        style: 'African Contemporary',
        progress: 65,
        userId: admin.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Commercial Complex - Bo',
        description: 'Mixed-use commercial development with retail and office spaces',
        type: 'Commercial',
        status: 'active',
        location: 'Bo, Sierra Leone',
        budget: 2200000,
        area: 1200,
        floors: 4,
        style: 'Modern',
        progress: 35,
        userId: architect.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'School Infrastructure Project',
        description: 'Primary school with 12 classrooms, library, and sports facilities',
        type: 'Institutional',
        status: 'draft',
        location: 'Makeni, Sierra Leone',
        budget: 850000,
        area: 800,
        floors: 2,
        style: 'Sustainable/Green',
        progress: 10,
        userId: engineer.id,
      },
    }),
  ]);

  for (const project of projects) {
    await prisma.bOQItem.createMany({
      data: [
        { item: 'Concrete (Grade 30)', unit: 'm³', quantity: 120, rate: 185, category: 'Structure', projectId: project.id },
        { item: 'Steel Reinforcement', unit: 'tonnes', quantity: 15, rate: 1200, category: 'Structure', projectId: project.id },
        { item: 'Cement (Portland)', unit: 'bags', quantity: 800, rate: 8.5, category: 'Materials', projectId: project.id },
        { item: 'Sand (Sharp)', unit: 'm³', quantity: 200, rate: 35, category: 'Materials', projectId: project.id },
        { item: 'Granite Aggregate', unit: 'm³', quantity: 150, rate: 45, category: 'Materials', projectId: project.id },
        { item: 'Clay Bricks', unit: 'pcs', quantity: 15000, rate: 0.35, category: 'Masonry', projectId: project.id },
        { item: 'Roofing Sheets', unit: 'm²', quantity: 350, rate: 22, category: 'Roofing', projectId: project.id },
        { item: 'Labor - Mason', unit: 'days', quantity: 120, rate: 45, category: 'Labor', projectId: project.id },
        { item: 'Labor - Carpenter', unit: 'days', quantity: 80, rate: 45, category: 'Labor', projectId: project.id },
        { item: 'Equipment Rental', unit: 'days', quantity: 60, rate: 250, category: 'Equipment', projectId: project.id },
      ],
    });

    await prisma.task.createMany({
      data: [
        { title: 'Site Survey & Analysis', status: 'completed', priority: 'high', projectId: project.id, assigneeId: engineer.id },
        { title: 'Foundation Design', status: 'in_progress', priority: 'high', projectId: project.id, assigneeId: architect.id },
        { title: 'Structural Calculations', status: 'todo', priority: 'high', projectId: project.id, assigneeId: engineer.id },
        { title: 'BOQ Preparation', status: 'todo', priority: 'medium', projectId: project.id, assigneeId: admin.id },
        { title: 'Permit Applications', status: 'todo', priority: 'medium', projectId: project.id },
      ],
    });
  }

  await prisma.teamMember.createMany({
    data: [
      { userId: admin.id, role: 'Project Manager' },
      { userId: architect.id, role: 'Lead Architect' },
      { userId: engineer.id, role: 'Structural Engineer' },
    ],
  });

  console.log('Seeding complete!');
  console.log(`Created ${projects.length} projects with BOQ items and tasks`);
  console.log('Login credentials: admin@aicos.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
