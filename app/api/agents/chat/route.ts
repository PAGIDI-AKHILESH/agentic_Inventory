import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/core/auth';
import { getAiClient } from '@/lib/ai/config';
import { searchSimilarDocuments } from '@/lib/ai/vectorStore';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
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

    const { message } = await request.json();
    
    const ai = getAiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
    }
    
    // Retrieve context using RAG
    const similarDocs = await searchSimilarDocuments(payload.tenantId, message, 5);
    const context = similarDocs.map(doc => doc.content).join('\n\n');

    // Fetch summary statistics
    const allItems = await prisma.inventoryItem.findMany({ 
      where: { tenantId: payload.tenantId, isDeleted: false },
      select: { currentStock: true, reorderPoint: true }
    });
    const totalItems = allItems.length;
    const lowStockItems = allItems.filter(item => item.currentStock <= item.reorderPoint).length;

    const prompt = `
You are an expert Inventory Intelligence Agent.
You are assisting a user with their supply chain and inventory management.

Here is some summary data about their inventory:
- Total unique items: ${totalItems}
- Items low on stock: ${lowStockItems}

Here is some specific context retrieved from their database based on their query:
${context}

User's message:
${message}

Please provide a helpful, concise, and professional response based on the context provided. If the context does not contain the answer, you can give general advice but clarify that you don't have the specific data.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      data: {
        response: response.text,
        agent: "Inventory Intelligence Coordinator",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process message'
    }, { status: 500 });
  }
}
