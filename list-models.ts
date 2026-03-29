import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('Prisma models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
prisma.$disconnect();
