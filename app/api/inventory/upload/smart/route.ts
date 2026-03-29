import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/core/auth';
import { AuditLogger } from '@/lib/governance/AuditLogger';
import { getAiClient } from '@/lib/ai/config';
import { Type } from '@google/genai';
import { syncTenantEmbeddings } from '@/lib/ai/vectorStore';

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

    const { csvText } = await req.json();

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 });
    }

    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ error: 'Invalid CSV format. Need at least headers and one row.' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const sampleRow = lines[1].split(',').map(v => v.trim());

    // Use Gemini to map the columns
    const ai = getAiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Smart upload requires a valid Gemini API Key. Please configure it in the settings.' }, { status: 400 });
    }
    
    const prompt = `
You are an expert data integration assistant for an inventory management system.
A user has uploaded a CSV file with their inventory data. Their column names might not match our standard schema.

Our standard schema requires the following fields:
- sku (string): Unique identifier for the product
- name (string): Name of the product
- category (string): Category of the product
- currentStock (number): Current quantity in stock
- unitCost (number): Cost to purchase the item
- sellingPrice (number): Price the item is sold for

Here are the headers from the user's CSV:
${headers.join(', ')}

Here is a sample row of data:
${sampleRow.join(', ')}

Please map the user's headers to our standard schema fields. 
Return a JSON object where the keys are our standard schema fields (sku, name, category, currentStock, unitCost, sellingPrice) and the values are the EXACT matching header names from the user's CSV. If a standard field cannot be reasonably mapped, set its value to null.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sku: { type: Type.STRING, nullable: true },
            name: { type: Type.STRING, nullable: true },
            category: { type: Type.STRING, nullable: true },
            currentStock: { type: Type.STRING, nullable: true },
            unitCost: { type: Type.STRING, nullable: true },
            sellingPrice: { type: Type.STRING, nullable: true },
          }
        }
      }
    });

    const mappingStr = response.text;
    if (!mappingStr) {
      throw new Error('Failed to generate mapping from AI');
    }

    const mapping = JSON.parse(mappingStr);
    
    const uploadTimestamp = new Date();
    const tenantId = payload.tenantId;

    // Parse the CSV using the AI-generated mapping
    const inventoryItems = lines.slice(1).map((line, rowIndex) => {
      const values = line.split(',').map(v => v.trim());
      const item: Record<string, string | number> = {};
      
      // Helper to get value by mapped header name
      const getValue = (standardField: string) => {
        const userHeader = mapping[standardField];
        if (!userHeader) return null;
        const index = headers.findIndex(h => h.toLowerCase() === userHeader.toLowerCase());
        return index !== -1 ? values[index] : null;
      };

      const skuVal = getValue('sku');
      const nameVal = getValue('name');
      const categoryVal = getValue('category');
      const stockVal = getValue('currentStock');
      const costVal = getValue('unitCost');
      const priceVal = getValue('sellingPrice');

      // Generate system data for missing or standard fields
      item.sku = skuVal ? String(skuVal) : `SYS-SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      item.name = nameVal ? String(nameVal) : `Unknown Product ${rowIndex + 1}`;
      item.category = categoryVal ? String(categoryVal) : 'Uncategorized';
      item.currentStock = stockVal ? parseInt(String(stockVal)) || 0 : 0;
      item.unitCost = costVal ? parseFloat(String(costVal)) || 0 : 0;
      item.sellingPrice = priceVal ? parseFloat(String(priceVal)) || 0 : 0;
      
      // System generated essential data
      item.reorderPoint = Math.max(10, Math.floor(Number(item.currentStock) * 0.2)); // 20% of current stock or 10
      item.leadTimeDays = Math.floor(Math.random() * 14) + 3; // 3 to 17 days
      item.salesVelocity = Math.floor(Math.random() * 50) + 5; // 5 to 55 units/month

      return item;
    });

    const operations = inventoryItems.map((item) => {
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
          category: String(item.category),
          currentStock: Number(item.currentStock),
          unitCost: Number(item.unitCost),
          sellingPrice: Number(item.sellingPrice),
          reorderPoint: Number(item.reorderPoint),
          lastUploadedAt: uploadTimestamp,
        },
        create: {
          tenantId,
          sku,
          name: String(item.name),
          category: String(item.category),
          currentStock: Number(item.currentStock),
          unitCost: Number(item.unitCost),
          sellingPrice: Number(item.sellingPrice),
          reorderPoint: Number(item.reorderPoint),
          lastUploadedAt: uploadTimestamp,
        }
      });
    });

    await prisma.$transaction(operations);

    AuditLogger.log({
      tenantId,
      userId: payload.userId,
      actionType: 'INVENTORY_UPLOADED_SMART',
      entityType: 'INVENTORY',
      entityId: 'batch',
      afterStateJson: { itemCount: inventoryItems.length, timestamp: uploadTimestamp, mapping },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Sync embeddings asynchronously
    Promise.resolve().then(() => syncTenantEmbeddings(tenantId)).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed and uploaded ${inventoryItems.length} items using AI mapping.`,
      mapping
    });
  } catch (error) {
    console.error('Smart inventory upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
