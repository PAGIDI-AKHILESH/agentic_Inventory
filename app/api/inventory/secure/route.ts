import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/core/middleware';
import { inventoryRepository } from '@/lib/db/repositories/InventoryRepository';
import { AuditLogger } from '@/lib/governance/AuditLogger';

async function getInventory(req: AuthenticatedRequest) {
  try {
    const tenantId = req.user!.tenantId;
    const items = await inventoryRepository.findMany(tenantId);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createInventoryItem(req: AuthenticatedRequest) {
  try {
    const tenantId = req.user!.tenantId;
    const data = await req.json();

    // Basic validation
    if (!data.sku || !data.name || !data.category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for duplicate SKU within the tenant
    const existing = await inventoryRepository.findBySku(tenantId, data.sku);
    if (existing) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }

    const item = await inventoryRepository.create(tenantId, data);

    AuditLogger.log({
      tenantId,
      userId: req.user!.userId,
      actionType: 'INVENTORY_ITEM_CREATED',
      entityType: 'INVENTORY_ITEM',
      entityId: item.id,
      afterStateJson: item,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply RBAC: Only OWNER and MANAGER can create items, but EMPLOYEE can view
export const GET = withAuth(getInventory, ['OWNER', 'MANAGER', 'EMPLOYEE']);
export const POST = withAuth(createInventoryItem, ['OWNER', 'MANAGER']);
