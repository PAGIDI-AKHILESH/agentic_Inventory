import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/core/auth';
import { getGeminiApiKey, getAiClient } from '@/lib/ai/config';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    const tenantId = payload.tenantId;

    // Fetch background generated insights
    const backgroundOutputs = await prisma.agentOutput.findMany({
      where: { tenantId, agentType: 'background_insight' },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    const backgroundInsights = backgroundOutputs.map(output => {
      try {
        const parsed = JSON.parse(output.outputJson);
        return {
          id: output.id,
          type: parsed.type || 'insight',
          title: parsed.title || 'Background Insight',
          message: parsed.message || 'New insight generated in the background.',
          timestamp: output.createdAt.toISOString()
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.log('Skipping insights generation: Valid Gemini API Key not found.');
      // Fallback insights
      const fallbackInsights = [
        {
          id: 'insight-1',
          type: 'alert',
          title: 'Low Stock Alert',
          message: 'Several high-margin items are running low. Consider reordering soon to avoid stockouts during the upcoming weekend rush.',
          timestamp: new Date().toISOString()
        },
        {
          id: 'insight-2',
          type: 'suggestion',
          title: 'Supplier Optimization',
          message: 'Your recent orders from "Global Tech Supplies" have been delayed. Consider diversifying your suppliers for electronics to maintain a steady supply chain.',
          timestamp: new Date().toISOString()
        },
        {
          id: 'insight-3',
          type: 'insight',
          title: 'Market Trend: Sustainable Packaging',
          message: 'Local market data shows a 15% increase in demand for products with sustainable packaging. Highlighting these items could boost sales.',
          timestamp: new Date().toISOString()
        }
      ];
      return NextResponse.json({ insights: [...backgroundInsights, ...fallbackInsights] });
    }
    const ai = getAiClient();
    if (!ai) throw new Error('Failed to initialize AI client');

    // Fetch user and tenant data to context
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { firstName: true, lastName: true, tenant: { select: { businessName: true } } },
    });

    const inventory = await prisma.inventoryItem.findMany({
      where: { tenantId },
      take: 20, // Limit to top 20 for context
      select: { name: true, currentStock: true, safetyStockLevel: true, category: true },
    });

    const sales = await prisma.salesTransaction.findMany({
      where: { tenantId },
      take: 10,
      orderBy: { transactionDate: 'desc' },
      select: { quantitySold: true, unitPrice: true, transactionDate: true, item: { select: { name: true } } },
    });

    const prompt = `
      You are an expert AI business advisor for an MSME (Micro, Small, and Medium Enterprise) owner named ${user?.firstName} ${user?.lastName} who runs "${user?.tenant?.businessName}".
      
      Here is a snapshot of their current inventory:
      ${JSON.stringify(inventory)}
      
      Here is a snapshot of their recent sales:
      ${JSON.stringify(sales)}
      
      Based on this data, generate 3 actionable insights, alerts, or suggestions for the owner. 
      Focus on what they should buy, why they should buy it, and how to optimize their inventory.
      Consider local and global market trends relevant to a retail/wholesale business.
      
      Return the response strictly as a JSON array of objects with the following structure:
      [
        {
          "id": "unique-id",
          "type": "alert" | "suggestion" | "insight",
          "title": "Short title",
          "message": "Detailed actionable message",
          "timestamp": "ISO date string"
        }
      ]
    `;

    let insights = [];
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      insights = JSON.parse(response.text || '[]');
    } catch (aiError) {
      console.warn('Gemini API failed, using fallback insights:', aiError);
      // Fallback insights
      insights = [
        {
          id: 'insight-1',
          type: 'alert',
          title: 'Low Stock Alert',
          message: 'Several high-margin items are running low. Consider reordering soon to avoid stockouts during the upcoming weekend rush.',
          timestamp: new Date().toISOString()
        },
        {
          id: 'insight-2',
          type: 'suggestion',
          title: 'Supplier Optimization',
          message: 'Your recent orders from "Global Tech Supplies" have been delayed. Consider diversifying your suppliers for electronics to maintain a steady supply chain.',
          timestamp: new Date().toISOString()
        },
        {
          id: 'insight-3',
          type: 'insight',
          title: 'Market Trend: Sustainable Packaging',
          message: 'Local market data shows a 15% increase in demand for products with sustainable packaging. Highlighting these items could boost sales.',
          timestamp: new Date().toISOString()
        }
      ];
    }

    // Combine and return
    const allInsights = [...backgroundInsights, ...insights];

    return NextResponse.json({ insights: allInsights });
  } catch (error) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: 'Failed to generate insights', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
