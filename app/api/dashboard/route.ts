import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/core/auth';
import { prisma } from '@/lib/db/prisma';

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

    const tenantId = decoded.tenantId;

    // 1. Inventory Metrics
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId, isDeleted: false }
    });

    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.currentStock <= item.reorderPoint);
    const lowStockCount = lowStockItems.length;
    const totalInventoryValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

    // 2. Sales Metrics (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    const recentSales = await prisma.salesTransaction.findMany({
      where: {
        tenantId,
        isDeleted: false,
        transactionDate: { gte: sevenDaysAgo }
      },
      include: { item: true }
    });

    const totalRevenue7d = recentSales.reduce((sum, sale) => sum + (sale.quantitySold * sale.unitPrice), 0);

    // Sales Trend (Group by Date)
    const salesByDate = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      salesByDate.set(d.toISOString().split('T')[0], 0);
    }

    recentSales.forEach(sale => {
      const dateStr = sale.transactionDate.toISOString().split('T')[0];
      if (salesByDate.has(dateStr)) {
        salesByDate.set(dateStr, salesByDate.get(dateStr)! + (sale.quantitySold * sale.unitPrice));
      }
    });

    const salesTrend = Array.from(salesByDate.entries()).map(([date, revenue]) => ({ date, revenue }));

    // Top Selling Products
    const productSales = new Map<string, { id: string, name: string, category: string, soldQty: number, revenue: number, status: string }>();
    
    recentSales.forEach(sale => {
      const existing = productSales.get(sale.itemId) || {
        id: sale.item.id,
        name: sale.item.name,
        category: sale.item.category || 'Uncategorized',
        soldQty: 0,
        revenue: 0,
        status: sale.item.currentStock <= sale.item.reorderPoint ? 'Low Stock' : 'Healthy'
      };
      existing.soldQty += sale.quantitySold;
      existing.revenue += (sale.quantitySold * sale.unitPrice);
      productSales.set(sale.itemId, existing);
    });

    const topSellers = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(item => ({ ...item, trend: 'Up' })); // Mock trend for now

    // 3. AI Insights (Latest 3)
    const recentInsights = await prisma.agentOutput.findMany({
      where: { tenantId, agentType: 'background_insight', isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalItems,
          lowStockCount,
          totalInventoryValue,
          totalRevenue7d,
          healthScore: totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 100) : 100
        },
        lowStockItems: lowStockItems.slice(0, 5),
        salesTrend,
        topSellers,
        recentInsights: recentInsights.map(i => JSON.parse(i.outputJson))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
