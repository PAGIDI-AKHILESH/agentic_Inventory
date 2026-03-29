import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/core/auth';
import { AuditLogger } from '@/lib/governance/AuditLogger';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { inventoryItems } = await req.json();

    if (!inventoryItems || !Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      return NextResponse.json({ error: 'No inventory items provided' }, { status: 400 });
    }

    const uploadTimestamp = new Date();
    const tenantId = payload.tenantId;

    // We can either update existing items or create new ones.
    // For simplicity, we'll use upsert or createMany with skipDuplicates.
    // Let's use a transaction to upsert all items.
    
    const operations = inventoryItems.map((item: Record<string, string | number>) => {
      const sku = String(item.sku);
      return prisma.inventoryItem.upsert({
        where: {
          tenantId_sku: {
            tenantId,
            sku,
          }
        },
        update: {
          name: String(item.name),
          category: String(item.category || 'Uncategorized'),
          currentStock: Number(item.currentStock || 0),
          unitCost: Number(item.unitCost || 0),
          sellingPrice: Number(item.sellingPrice || 0),
          lastUploadedAt: uploadTimestamp,
        },
        create: {
          tenantId,
          sku,
          name: String(item.name),
          category: String(item.category || 'Uncategorized'),
          currentStock: Number(item.currentStock || 0),
          unitCost: Number(item.unitCost || 0),
          sellingPrice: Number(item.sellingPrice || 0),
          lastUploadedAt: uploadTimestamp,
        }
      });
    });

    await prisma.$transaction(operations);

    AuditLogger.log({
      tenantId,
      userId: payload.userId,
      actionType: 'INVENTORY_UPLOADED',
      entityType: 'INVENTORY',
      entityId: 'batch',
      afterStateJson: { itemCount: inventoryItems.length, timestamp: uploadTimestamp },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, message: `Successfully uploaded ${inventoryItems.length} items.` });
  } catch (error) {
    console.error('Inventory upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
