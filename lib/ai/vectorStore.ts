import { prisma } from '../db/prisma.ts';
import { getGeminiApiKey, getAiClient } from './config.ts';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

let hasLoggedInvalidKeyError = false;

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      if (!hasLoggedInvalidKeyError) {
        console.log('Skipping embedding generation: Valid Gemini API Key not found.');
        hasLoggedInvalidKeyError = true;
      }
      return [];
    }
    const ai = getAiClient();
    if (!ai) return [];
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
    });
    return result.embeddings?.[0]?.values || [];
  } catch (error) {
    const err = error as Error;
    if (err?.message?.includes('API key not valid')) {
      if (!hasLoggedInvalidKeyError) {
        console.log('Skipping embedding generation: Valid Gemini API Key not found.');
        hasLoggedInvalidKeyError = true;
      }
    } else {
      console.error('Failed to generate embedding:', error);
    }
    return [];
  }
}

export async function upsertDocumentEmbedding(tenantId: string, entityType: string, entityId: string, content: string) {
  const embedding = await generateEmbedding(content);
  if (!embedding.length) return;

  await prisma.documentEmbedding.upsert({
    where: {
      tenantId_entityType_entityId: { tenantId, entityType, entityId }
    },
    update: {
      content,
      embeddingJson: JSON.stringify(embedding)
    },
    create: {
      tenantId,
      entityType,
      entityId,
      content,
      embeddingJson: JSON.stringify(embedding)
    }
  });
}

export async function searchSimilarDocuments(tenantId: string, query: string, topK: number = 5) {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding.length) return [];

  const allDocs = await prisma.documentEmbedding.findMany({
    where: { tenantId }
  });

  const scoredDocs = allDocs.map(doc => {
    const docEmbedding = JSON.parse(doc.embeddingJson) as number[];
    const score = cosineSimilarity(queryEmbedding, docEmbedding);
    return { ...doc, score };
  });

  scoredDocs.sort((a, b) => b.score - a.score);
  return scoredDocs.slice(0, topK);
}

// Helper to sync all inventory items and sales for a tenant
export async function syncTenantEmbeddings(tenantId: string) {
  console.log(`Syncing embeddings for tenant ${tenantId}...`);
  
  const items = await prisma.inventoryItem.findMany({ where: { tenantId } });
  for (const item of items) {
    const content = `Inventory Item: ${item.name} (SKU: ${item.sku}). Category: ${item.category || 'N/A'}. Current Stock: ${item.currentStock}. Price: $${item.sellingPrice}. Cost: $${item.unitCost}. Lead Time: ${item.leadTimeDays} days.`;
    await upsertDocumentEmbedding(tenantId, 'InventoryItem', item.id, content);
  }

  const sales = await prisma.salesTransaction.findMany({ 
    where: { tenantId },
    include: { item: true }
  });
  for (const sale of sales) {
    const content = `Sales Transaction: Sold ${sale.quantitySold} units of ${sale.item.name} (SKU: ${sale.item.sku}) at $${sale.unitPrice} each on ${sale.transactionDate.toISOString().split('T')[0]} via ${sale.channel} channel.`;
    await upsertDocumentEmbedding(tenantId, 'SalesTransaction', sale.id, content);
  }
  
  console.log(`Finished syncing embeddings for tenant ${tenantId}.`);
}
