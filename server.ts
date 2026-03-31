import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import cron from 'node-cron';
import { prisma } from './lib/db/prisma.ts';
import { getGeminiApiKey, getAiClient } from './lib/ai/config.ts';
import { syncTenantEmbeddings } from './lib/ai/vectorStore.ts';
import { startTelegramBot } from './lib/telegram/bot.ts';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let hasLoggedInvalidKeyError = false;

// Background job to generate insights for tenants
async function generateBackgroundInsights() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    if (!hasLoggedInvalidKeyError) {
      console.log('Skipping background insights: Valid Gemini API Key not found.');
      hasLoggedInvalidKeyError = true;
    }
    return;
  }
  
  const ai = getAiClient();
  if (!ai) return;
  console.log('Running background task: Generating predictive insights for all tenants...');
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active', isDeleted: false }
    });

    for (const tenant of tenants) {
      // Add a 6-second delay between processing each tenant to respect the
      // Gemini 2.0 Flash Free Tier limit of 15 Requests Per Minute.
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Fetch inventory and recent sales
      const items = await prisma.inventoryItem.findMany({
        where: { tenantId: tenant.id },
        include: { supplier: true },
        take: 100
      });

      if (items.length === 0) continue;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSales = await prisma.salesTransaction.findMany({
        where: { 
          tenantId: tenant.id,
          transactionDate: { gte: thirtyDaysAgo }
        }
      });

      // Calculate velocity and predict stockouts
      const analysis = items.map(item => {
        const itemSales = recentSales.filter(s => s.itemId === item.id);
        const totalSold30Days = itemSales.reduce((sum, s) => sum + s.quantitySold, 0);
        const dailyVelocity = totalSold30Days / 30;
        const daysRemaining = dailyVelocity > 0 ? item.currentStock / dailyVelocity : 999;
        const isAtRisk = daysRemaining <= (item.leadTimeDays + 3); // Alert if we'll run out within lead time + 3 days buffer

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          stock: item.currentStock,
          velocity: dailyVelocity.toFixed(2),
          daysRemaining: Math.round(daysRemaining),
          isAtRisk,
          supplierId: item.supplierId,
          unitCost: item.unitCost,
          leadTimeDays: item.leadTimeDays
        };
      });

      const atRiskItems = analysis.filter(i => i.isAtRisk || i.stock <= 0);
      
      if (atRiskItems.length > 0) {
        try {
          const prompt = `
            You are an Enterprise AI Supply Chain Advisor. Analyze this predictive stockout data for a business named "${tenant.businessName}":
            At-Risk Items: ${JSON.stringify(atRiskItems)}
            
            Generate a highly professional, actionable insight JSON object:
            {
              "type": "alert",
              "title": "Predictive Stockout Warning",
              "message": "A detailed, data-driven message explaining the risk and recommending immediate action (e.g., reorder quantities based on velocity).",
              "recommendedOrders": [
                { "itemId": "string", "recommendedQuantity": number, "reasoning": "string" }
              ]
            }
          `;
          
          const { Type } = await import('@google/genai');
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { 
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  message: { type: Type.STRING },
                  recommendedOrders: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        itemId: { type: Type.STRING },
                        recommendedQuantity: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                      },
                      required: ["itemId", "recommendedQuantity", "reasoning"]
                    }
                  }
                },
                required: ["type", "title", "message", "recommendedOrders"]
              }
            }
          });
          
          const insight = JSON.parse(response.text || '{}');
          
          // Store the insight in the database
          await prisma.agentOutput.create({
            data: {
              tenantId: tenant.id,
              agentType: 'background_insight',
              outputJson: JSON.stringify(insight),
              inputSnapshotJson: JSON.stringify({ atRiskCount: atRiskItems.length, analysis }),
              confidenceScore: 0.98
            }
          });

          // Automatically create Draft Purchase Orders for recommended items
          if (insight.recommendedOrders && Array.isArray(insight.recommendedOrders)) {
            for (const order of insight.recommendedOrders) {
              const item = atRiskItems.find(i => i.id === order.itemId);
              if (item && item.supplierId) {
                // Check if a pending PO already exists for this item to avoid duplicates
                const existingPO = await prisma.purchaseOrder.findFirst({
                  where: {
                    tenantId: tenant.id,
                    itemId: item.id,
                    status: 'PENDING_APPROVAL'
                  }
                });

                if (!existingPO) {
                  await prisma.purchaseOrder.create({
                    data: {
                      tenantId: tenant.id,
                      supplierId: item.supplierId,
                      itemId: item.id,
                      quantityOrdered: order.recommendedQuantity,
                      unitCost: item.unitCost,
                      status: 'PENDING_APPROVAL',
                      createdBy: 'AI_AGENT'
                    }
                  });
                  console.log(`Created automated PO for item ${item.name} (Qty: ${order.recommendedQuantity})`);
                }
              }
            }
          }
          
          console.log(`Generated predictive insight for tenant: ${tenant.id}`);
        } catch (aiError: any) {
          const errMessage = aiError?.message || '';
          if (errMessage.includes('API key not valid')) {
            if (!hasLoggedInvalidKeyError) {
              console.log('Skipping AI insights generation: Valid Gemini API Key not found.');
              hasLoggedInvalidKeyError = true;
            }
            break; // Stop processing other tenants if the API key is invalid
          } else if (aiError.status === 429 || errMessage.includes('429') || errMessage.includes('quota')) {
            console.warn(`Rate limit (429) hit while generating background insights. Pausing for 60 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            // Do not break; it will resume the next tenant after slowing down.
          } else {
            console.error(`Failed to generate AI insight for tenant ${tenant.id}:`, aiError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in background insights job:', error);
  }
}

app.prepare().then(() => {
  // Schedule the background job to run every hour
  // For demonstration/testing, we can also run it every 5 minutes: '*/5 * * * *'
  cron.schedule('0 * * * *', () => {
    generateBackgroundInsights();
  });

  // Schedule vector store sync every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running background task: Syncing Vector Store for all tenants...');
    try {
      const tenants = await prisma.tenant.findMany({
        where: { status: 'active', isDeleted: false }
      });
      for (const tenant of tenants) {
        await syncTenantEmbeddings(tenant.id);
      }
    } catch (error) {
      console.error('Error in vector store sync job:', error);
    }
  });

  // Run once on startup after a short delay
  // COMMENTED OUT: Running this on every startup rapidly consumes the 15-requests/minute free-tier Gemini API quota.
  // We will leave this exclusively to the cron schedule during development to preserve quota for the Chatbot and Telegram bot!
  /*
  setTimeout(() => {
    generateBackgroundInsights();
  }, 10000);
  */

  // Start Telegram Bot
  try {
    startTelegramBot();
  } catch (err) {
    console.error('Failed to start Telegram Bot:', err);
  }

  // Enable graceful stop
  const shutdown = async (signal: string) => {
    console.log(`> ${signal} received. Shutting down...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    if (parsedUrl.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  // Handle Hot Module Replacement (HMR) upgrade requests
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/_next/webpack-hmr')) {
      app.getUpgradeHandler()(req, socket, head);
    }
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
    console.log('> Background jobs scheduled.');
  });
});
