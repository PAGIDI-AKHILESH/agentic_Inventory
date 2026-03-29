import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant-id' },
    update: {},
    create: {
      id: 'demo-tenant-id',
      businessName: 'Acme Corp',
      domain: 'acme.com',
      industryVertical: 'Retail',
      subscriptionTier: 'free',
    },
  });

  // 2. Create Demo User
  const hashedPassword = await bcrypt.hash('password', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@acme.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'owner',
      isEmailVerified: true,
    },
  });

  console.log('Seed complete:', { tenant: tenant.businessName, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
