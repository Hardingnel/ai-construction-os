import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const keys = Object.keys(p).filter(k => k[0] !== '_');
console.log('Models:', JSON.stringify(keys));
p.$disconnect();
