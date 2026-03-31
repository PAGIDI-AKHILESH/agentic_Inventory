import { getAiClient } from '../ai/config.ts';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processAgentQuery(phoneNumber: string, query: string, platform: 'telegram') {
  try {
    const ai = getAiClient();
    if (!ai) {
      console.error('Error processing agent query: Valid Gemini API Key not found.');
      return "I'm sorry, the AI service is currently unavailable due to an invalid API key configuration.";
    }
    // 1. Find user by phone number
    const user = await prisma.user.findFirst({
      where: { phoneNumber, isPhoneVerified: true },
      include: { tenant: true }
    });

    if (!user) {
      return "I couldn't find a verified account associated with this phone number. Please register or verify your phone number on our platform.";
    }

    // 2. Fetch their inventory
    const inventory = await prisma.inventoryItem.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { lastUploadedAt: 'desc' }
    });

    if (!inventory || inventory.length === 0) {
      return "Your inventory is currently empty. Please upload your inventory data through the dashboard or connect your ERP system.";
    }

    // 3. Format inventory data for the prompt
    // We only send essential data to save tokens
    const inventoryContext = inventory.map(item => 
      `SKU: ${item.sku}, Name: ${item.name}, Stock: ${item.currentStock}, Price: $${item.sellingPrice}, Last Updated: ${item.lastUploadedAt ? item.lastUploadedAt.toISOString() : 'Unknown'}`
    ).join('\n');

    // 4. Generate response using Gemini
    const systemInstruction = `You are an expert AI inventory management assistant for ${user.tenant.businessName || 'a business'}. 
Your user (${user.firstName} ${user.lastName}) is asking you a question via ${platform}.
Here is their current inventory data:
${inventoryContext}

Answer their query accurately based ONLY on the provided inventory data. 
Be concise, professional, and helpful. If they ask about something not in the inventory, politely inform them.
If they ask for insights, analyze the stock levels and provide useful business advice (e.g., low stock warnings).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response at this time.";
  } catch (error) {
    const err = error as Error;
    if (err?.message?.includes('API key not valid')) {
      console.log('Skipping agent query: Valid Gemini API Key not found.');
      return "I'm sorry, the AI service is currently unavailable due to an invalid API key configuration.";
    }
    console.error('Error processing agent query:', error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
}
