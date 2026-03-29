import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/core/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { tenantId: decoded.tenantId },
      include: {
        item: true,
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ purchaseOrders });
  } catch (error) {
    console.error('Failed to fetch purchase orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, poId } = await request.json();

    if (!poId || !action) {
      return NextResponse.json({ error: 'Missing poId or action' }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId: decoded.tenantId }
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const updatedPO = await prisma.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date()
        }
      });
      
      // Simulate sending to supplier (in a real app, this would trigger an email/webhook)
      console.log(`PO ${poId} approved and sent to supplier.`);
      
      return NextResponse.json({ success: true, purchaseOrder: updatedPO });
    } else if (action === 'REJECT') {
      const updatedPO = await prisma.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'REJECTED'
        }
      });
      return NextResponse.json({ success: true, purchaseOrder: updatedPO });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Failed to process purchase order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
