import { prisma } from './lib/db/prisma';
import bcrypt from 'bcryptjs';

async function testRegister() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  const companyName = 'Test Corp';
  const phoneNumber = '+1234567890';

  console.log('Starting registration test...');

  try {
    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        businessName: companyName,
        domain: email.split('@')[1],
        subscriptionTier: 'free',
        industryVertical: 'Retail',
        settingsJson: JSON.stringify({ revenueRange: 'Under $1M' }),
      },
    });
    console.log('Tenant created:', tenant.id);

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create User
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        phoneNumber,
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'owner',
      },
    });
    console.log('User created:', user.id);

    // 4. Create Inventory Items
    const inventoryItems = [
      { sku: 'SKU-1', name: 'Item 1', currentStock: 10 },
      { sku: 'SKU-2', name: 'Item 2', currentStock: 20 },
    ];

    await prisma.inventoryItem.createMany({
      data: inventoryItems.map(item => ({
        tenantId: tenant.id,
        sku: item.sku,
        name: item.name,
        currentStock: item.currentStock,
        category: 'Test',
        unitCost: 5,
        sellingPrice: 10,
      })),
    });
    console.log('Inventory items created');

    // 5. Create Connector Token
    await prisma.connectorToken.create({
      data: {
        tenantId: tenant.id,
        provider: 'telegram',
        accessTokenEncrypted: 'mock_token',
      },
    });
    console.log('Telegram connector token created');

    await prisma.connectorToken.create({
      data: {
        tenantId: tenant.id,
        provider: 'shopify',
        accessTokenEncrypted: 'mock_shopify_token',
      },
    });
    console.log('Shopify connector token created');

    console.log('Registration test successful!');
  } catch (error) {
    console.error('Registration test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRegister();
