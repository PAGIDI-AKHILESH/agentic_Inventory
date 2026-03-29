import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/repositories/UserRepository';
import { tenantRepository } from '@/lib/db/repositories/TenantRepository';
import { generateTokens } from '@/lib/core/auth';
import { AuditLogger } from '@/lib/governance/AuditLogger';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { syncTenantEmbeddings } from '@/lib/ai/vectorStore';

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, companyName, industry, revenue, phoneNumber, isPhoneVerified, inventoryItems, integrations } = await req.json();

    // 1. Validate Input (Basic validation for now)
    if (!email || !password || !companyName || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Registering user:', email);

    // 2. Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // 3. Create Tenant
    console.log('Creating tenant for:', companyName);
    const tenant = await tenantRepository.create({
      businessName: companyName,
      domain: email.split('@')[1], // Simple domain extraction
      subscriptionTier: 'free',
      industryVertical: industry,
      settingsJson: JSON.stringify({ revenueRange: revenue }),
    });
    console.log('Tenant created:', tenant.id);

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create User (Owner of the tenant)
    console.log('Creating user:', email);
    const user = await userRepository.create(tenant.id, {
      email,
      phoneNumber,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'owner',
      isEmailVerified: false, // Require verification in a real app
      isPhoneVerified: isPhoneVerified || false,
    });
    console.log('User created:', user.id);

    // 6. Save Inventory Items if any
    if (inventoryItems && Array.isArray(inventoryItems) && inventoryItems.length > 0) {
      console.log('Saving inventory items:', inventoryItems.length);
      const uploadTimestamp = new Date();
      await prisma.inventoryItem.createMany({
        data: inventoryItems.map((item: Record<string, string | number>) => ({
          tenantId: tenant.id,
          sku: String(item.sku),
          name: String(item.name),
          category: String(item.category || 'Uncategorized'),
          currentStock: Number(item.currentStock || 0),
          unitCost: Number(item.unitCost || 0),
          sellingPrice: Number(item.sellingPrice || 0),
          lastUploadedAt: uploadTimestamp,
        })),
      });
      console.log('Inventory items saved');
      
      // Sync embeddings asynchronously
      Promise.resolve().then(() => syncTenantEmbeddings(tenant.id)).catch(console.error);
    }

    // 7. Save Integrations
    console.log('Saving integrations:', integrations);
    if (integrations?.telegram) {
      await prisma.connectorToken.create({
        data: {
          tenantId: tenant.id,
          provider: 'telegram',
          accessTokenEncrypted: 'mock_telegram_token',
        }
      });
    }
    if (integrations?.erpSystem) {
      await prisma.connectorToken.create({
        data: {
          tenantId: tenant.id,
          provider: integrations.erpSystem,
          accessTokenEncrypted: `mock_${integrations.erpSystem}_token`,
        }
      });
    }
    console.log('Integrations saved');

    // 8. Generate Tokens
    console.log('Generating tokens');
    const tokens = generateTokens({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    });

    // 9. Audit Log
    AuditLogger.log({
      tenantId: tenant.id,
      userId: user.id,
      actionType: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      afterStateJson: { email: user.email, role: user.role, phoneNumber: user.phoneNumber },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: tenant.businessName
      }, 
      tokens 
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ error: 'Internal server error', details: errorMessage, stack: errorStack }, { status: 500 });
  }
}
