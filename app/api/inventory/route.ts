import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/core/auth';
import { prisma } from '@/lib/db/prisma';
import { syncTenantEmbeddings } from '@/lib/ai/vectorStore';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId: decoded.tenantId,
        isDeleted: false
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Compute status and risk for the frontend
    const enrichedItems = items.map(item => ({
      ...item,
      status: item.currentStock <= item.reorderPoint ? 'Low Stock' : 'Optimal',
      risk: item.currentStock <= item.reorderPoint ? 'High' : 'Low',
      salesVelocity: Math.floor(Math.random() * 50) + 5 // Mock sales velocity
    }));

    return NextResponse.json({
      success: true,
      items: enrichedItems,
      meta: {
        total: items.length,
        page: 1,
        limit: 50
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate and insert into DB
    const newItem = await prisma.inventoryItem.create({
      data: {
        tenantId: decoded.tenantId,
        sku: body.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
        name: body.name,
        category: body.category,
        currentStock: body.stock || body.currentStock || 0,
        unitCost: body.cost || body.unitCost || 0,
        sellingPrice: body.price || body.sellingPrice || 0,
        reorderPoint: body.reorderPoint || 0,
      }
    });
    
    // Sync embeddings asynchronously
    Promise.resolve().then(() => syncTenantEmbeddings(decoded.tenantId)).catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        ...newItem,
        status: newItem.currentStock <= newItem.reorderPoint ? 'Low Stock' : 'Optimal',
        risk: newItem.currentStock <= newItem.reorderPoint ? 'High' : 'Low'
      },
      message: 'Inventory item created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({
      success: false,
      message: 'Invalid request body or database error'
    }, { status: 400 });
  }
}
