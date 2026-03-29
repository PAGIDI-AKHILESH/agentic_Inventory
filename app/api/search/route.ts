import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/core/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    const tenantId = payload.tenantId;

    const url = new URL(req.url);
    const query = url.searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Search Inventory Items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 5,
      select: { id: true, name: true, sku: true, category: true },
    });

    // Search Suppliers
    const suppliers = await prisma.supplier.findMany({
      where: {
        tenantId,
        name: { contains: query },
      },
      take: 5,
      select: { id: true, name: true, contactInfoJson: true },
    });

    const results = [
      ...inventoryItems.map(item => ({ type: 'inventory', id: item.id, title: item.name, subtitle: `SKU: ${item.sku} | Category: ${item.category}` })),
      ...suppliers.map(sup => {
        let email = 'N/A';
        try {
          if (sup.contactInfoJson) {
            const contact = JSON.parse(sup.contactInfoJson);
            email = contact.email || 'N/A';
          }
        } catch {
          // Ignore JSON parse errors
        }
        return { type: 'supplier', id: sup.id, title: sup.name, subtitle: `Email: ${email}` };
      }),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
