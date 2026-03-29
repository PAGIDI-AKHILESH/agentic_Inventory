import { Telegraf, Markup, Context, session, Scenes } from 'telegraf';
import { prisma } from '../db/prisma.ts';
import { getAiClient } from '../ai/config.ts';
import { searchSimilarDocuments, syncTenantEmbeddings } from '../ai/vectorStore.ts';
import { registerWizard, loginWizard, MyContext } from './scenes.ts';

const token = process.env.TELEGRAM_BOT_TOKEN;

const globalForTelegram = globalThis as unknown as {
  telegramBot: Telegraf<MyContext> | null;
  isBotInitialized: boolean;
};

export const bot = globalForTelegram.telegramBot || (token ? new Telegraf<MyContext>(token) : null);
if (process.env.NODE_ENV !== 'production') {
  globalForTelegram.telegramBot = bot;
}

export function initBotHandlers() {
  if (!bot || globalForTelegram.isBotInitialized) return;
  globalForTelegram.isBotInitialized = true;

  const getAi = () => getAiClient();
  
  // Global error handler for the bot
  bot.catch((err, ctx) => {
    console.error(`Telegram Bot Error:`, err);
    ctx.reply('An unexpected error occurred. Please try again later.').catch(console.error);
  });
  const stage = new Scenes.Stage<MyContext>([registerWizard, loginWizard]);
  bot.use(session());
  bot.use(stage.middleware());

  // Helper to get user by chat ID
  const getUserByChatId = async (chatId: number) => {
    return await prisma.user.findUnique({
      where: { telegramChatId: chatId.toString() },
      include: { tenant: true }
    });
  };

  const userRateLimits = new Map<number, { count: number, lastReset: number }>();
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 30;

  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();
    
    const userId = ctx.from.id;
    const now = Date.now();
    const userLimit = userRateLimits.get(userId) || { count: 0, lastReset: now };
    
    if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
      userLimit.count = 1;
      userLimit.lastReset = now;
    } else {
      userLimit.count++;
    }
    
    userRateLimits.set(userId, userLimit);
    
    if (userLimit.count > MAX_REQUESTS_PER_WINDOW) {
      if (userLimit.count === MAX_REQUESTS_PER_WINDOW + 1) {
        await ctx.reply('⚠️ You are sending messages too fast. Please slow down.');
      }
      return;
    }
    
    return next();
  });

  bot.start(async (ctx) => {
    const startPayload = ctx.startPayload;
    if (startPayload && startPayload.startsWith('LINK_')) {
      const phone = startPayload.replace('LINK_', '');
      const user = await prisma.user.findFirst({
        where: { phoneNumber: { contains: phone } }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramChatId: ctx.chat.id.toString() }
        });
        await ctx.reply(`✅ Account linked successfully! Welcome, ${user.firstName || 'User'}. How can I assist you today?`, getServiceKeyboard());
        return;
      } else {
        await ctx.reply('❌ Could not find an account with that phone number. Please ensure your phone number is correct in the web dashboard settings.');
      }
    }

    const user = await getUserByChatId(ctx.chat.id);
    if (user) {
      await ctx.reply(`Welcome back, ${user.firstName || 'User'}! I am your MSME Autopilot Bot. How can I assist you today?`, getServiceKeyboard());
    } else {
      await ctx.reply('Hello! I am your MSME Autopilot Bot. Please login or register to connect your account.', getAuthKeyboard());
    }
  });

  bot.help(async (ctx) => {
    await ctx.reply(`
You can use the following commands:
/start - Start the bot
/help - Get help information
/mystocks - View your stock portfolio
/news - Get personalized market news
/report - Generate a comprehensive business report with charts
/sales - View recent sales performance and trends
/insights - View AI-generated business insights
/po - View and approve pending Purchase Orders
/forecast - Generate demand forecasts
/suppliers - View your suppliers
/sync - Sync your business data into the AI Vector Store
/cancel - Cancel current operation
/register - Register a new account
/login - Login to your account
/services - View available services
/auth - Authentication options

💡 *Tip:* You can ask me follow-up questions about any report, news, or chart I send you!
    `, { parse_mode: 'Markdown' });
  });

  const getServiceKeyboard = () => {
    return Markup.keyboard([
      ['📦 My Stocks', '📰 Market News'],
      ['📊 Business Report', '📈 Sales & Charts'],
      ['💡 AI Insights', '🛒 Purchase Orders'],
      ['🔮 Forecasting', '🏭 Suppliers'],
      ['❓ Help', '🚪 Logout']
    ]).resize();
  };

  const getAuthKeyboard = () => {
    return Markup.inlineKeyboard([
      Markup.button.callback('Register', 'auth_register'),
      Markup.button.callback('Login', 'auth_login')
    ]);
  };

  bot.command('auth', async (ctx) => {
    await ctx.reply('Please choose an option:', getAuthKeyboard());
  });

  bot.command('cancel', async (ctx) => {
    await ctx.scene.leave();
    await ctx.reply('Operation cancelled.', getServiceKeyboard());
  });

  bot.action('auth_register', async (ctx) => {
    await ctx.scene.enter('register_wizard');
  });

  bot.action('auth_login', async (ctx) => {
    await ctx.scene.enter('login_wizard');
  });

  bot.command('register', async (ctx) => {
    await ctx.scene.enter('register_wizard');
  });

  bot.command('login', async (ctx) => {
    await ctx.scene.enter('login_wizard');
  });

  bot.command('forgot_password', async (ctx) => {
    await ctx.scene.enter('login_wizard', { isForgotPassword: true });
  });

  bot.hears('🚪 Logout', async (ctx) => {
    try {
      await prisma.user.updateMany({
        where: { telegramChatId: ctx.chat.id.toString() },
        data: { telegramChatId: null }
      });
      await ctx.reply('You have been logged out from Telegram.', Markup.removeKeyboard());
    } catch {
      await ctx.reply('Error logging out.');
    }
  });

  const handleMyStocks = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }

    const items = await prisma.inventoryItem.findMany({
      where: { tenantId: user.tenantId },
      take: 10,
      orderBy: { currentStock: 'asc' }
    });

    if (items.length === 0) {
      await ctx.reply('Your stock portfolio is currently empty. Add items through the web dashboard.');
      return;
    }

    let message = '📦 *Your Top 10 Stocks (Lowest First):*\n\n';
    items.forEach(item => {
      const status = item.currentStock <= item.safetyStockLevel ? '⚠️ Low' : '✅ OK';
      message += `- *${item.name}* (SKU: ${item.sku})\n  Stock: ${item.currentStock} | Price: $${item.sellingPrice} | Status: ${status}\n\n`;
    });

    await ctx.replyWithMarkdown(message);
  };

  bot.command('mystocks', handleMyStocks);
  bot.hears('📦 My Stocks', handleMyStocks);

  const handleNews = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }

    const ai = getAi();
    if (!ai) {
      await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      return;
    }

    await ctx.reply('🔍 Analyzing global and local market trends tailored to your business...');
    try {
      const prompt = `You are an enterprise business advisor. Find the latest real-world news and market trends specifically relevant to a "${user.tenant.businessType}" business named "${user.tenant.businessName}". Provide 3-4 highly actionable, detailed bullet points. Explain how each impacts their supply chain, pricing, or sales. Use real recent events.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      
      const myCtx = ctx as MyContext;
      myCtx.session = myCtx.session || { cursor: 0 };
      myCtx.session.chatHistory = myCtx.session.chatHistory || [];
      myCtx.session.chatHistory.push({ role: 'model', text: response.text || '' });

      await ctx.replyWithMarkdown(`📰 *Personalized Market Intelligence:*\n\n${response.text}`);
    } catch (error) {
      const err = error as Error;
      if (err?.message?.includes('API key not valid')) {
        await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      } else {
        console.error('News error:', error);
        await ctx.reply('Sorry, I encountered an error fetching your personalized news.');
      }
    }
  };

  bot.command('news', handleNews);
  bot.hears('📰 Market News', handleNews);

  const handleReport = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }

    const ai = getAi();
    if (!ai) {
      await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      return;
    }

    await ctx.reply('📊 Generating your comprehensive enterprise report and charts...');
    
    try {
      const items = await prisma.inventoryItem.findMany({ where: { tenantId: user.tenantId } });
      const sales = await prisma.salesTransaction.findMany({ 
        where: { tenantId: user.tenantId },
        orderBy: { transactionDate: 'desc' },
        take: 100
      });

      const totalInventoryValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.quantitySold * sale.unitPrice), 0);
      const lowStockCount = items.filter(i => i.currentStock <= i.safetyStockLevel).length;

      const categoryMap = new Map<string, number>();
      items.forEach(item => {
        const cat = item.category || 'Uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + (item.currentStock * item.unitCost));
      });
      const chartLabels = Array.from(categoryMap.keys()).slice(0, 5);
      const chartData = Array.from(categoryMap.values()).slice(0, 5);
      
      const chartConfig = {
        type: 'doughnut',
        data: {
          labels: chartLabels,
          datasets: [{ data: chartData, label: 'Value ($)' }]
        },
        options: {
          title: { display: true, text: 'Inventory Value by Category' },
          plugins: { datalabels: { display: false } }
        }
      };
      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=600&h=400&bkg=white`;

      const prompt = `
        You are an Enterprise Business Analyst. Generate a professional executive summary report for "${user.tenant.businessName}" (${user.tenant.businessType}).
        
        Data Snapshot:
        - Total Inventory Items: ${items.length}
        - Total Inventory Value: $${totalInventoryValue.toFixed(2)}
        - Low Stock Items: ${lowStockCount}
        - Recent Sales Revenue (last 100 transactions): $${totalRevenue.toFixed(2)}
        
        Format the response in Markdown with clear headings:
        1. Executive Summary
        2. Inventory Health
        3. Sales Performance
        4. Key Recommendations
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      const myCtx = ctx as MyContext;
      myCtx.session = myCtx.session || { cursor: 0 };
      myCtx.session.chatHistory = myCtx.session.chatHistory || [];
      myCtx.session.chatHistory.push({ role: 'model', text: response.text || '' });

      await ctx.replyWithPhoto(chartUrl, { caption: '📈 Inventory Value Distribution' });
      await ctx.replyWithMarkdown(response.text || 'Failed to generate report.');
    } catch (error) {
      const err = error as Error;
      if (err?.message?.includes('API key not valid')) {
        await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      } else {
        console.error('Report Error:', error);
        await ctx.reply('Sorry, I encountered an error generating your report.');
      }
    }
  };

  bot.command('report', handleReport);
  bot.hears('📊 Business Report', handleReport);

  const handleSales = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }

    await ctx.reply('📈 Analyzing recent sales data...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const sales = await prisma.salesTransaction.findMany({
        where: { tenantId: user.tenantId, transactionDate: { gte: sevenDaysAgo } },
        orderBy: { transactionDate: 'asc' }
      });

      if (sales.length === 0) {
        await ctx.reply('No sales data found for the last 7 days.');
        return;
      }

      const salesByDate = new Map<string, number>();
      sales.forEach(s => {
        const dateStr = s.transactionDate.toISOString().split('T')[0];
        salesByDate.set(dateStr, (salesByDate.get(dateStr) || 0) + (s.quantitySold * s.unitPrice));
      });

      const labels = Array.from(salesByDate.keys());
      const data = Array.from(salesByDate.values());

      const chartConfig = {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Revenue ($)', data, backgroundColor: '#4f46e5' }]
        },
        options: {
          title: { display: true, text: '7-Day Revenue Trend' }
        }
      };
      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=600&h=400&bkg=white`;

      const totalRev = data.reduce((a, b) => a + b, 0);
      await ctx.replyWithPhoto(chartUrl, { caption: `*7-Day Revenue:* $${totalRev.toFixed(2)}`, parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Sales error:', error);
      await ctx.reply('Sorry, I encountered an error fetching sales data.');
    }
  };

  bot.command('sales', handleSales);
  bot.hears('📈 Sales & Charts', handleSales);

  const handleInsights = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }

    await ctx.reply('💡 Fetching your latest AI-generated business insights...');
    try {
      const insights = await prisma.agentOutput.findMany({
        where: { tenantId: user.tenantId, agentType: 'background_insight' },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      if (insights.length === 0) {
        await ctx.reply('No recent insights available. The AI generates these automatically in the background based on your data.');
        return;
      }

      for (const insight of insights) {
        const data = JSON.parse(insight.outputJson);
        let msg = `*${data.title || 'Insight'}*\n${data.message || ''}\n`;
        if (data.recommendedOrders && data.recommendedOrders.length > 0) {
          msg += `\n*Recommendations:*\n`;
          data.recommendedOrders.forEach((o: { recommendedQuantity: number, itemId: string, reasoning: string }) => {
            msg += `- Reorder ${o.recommendedQuantity} units of item ${o.itemId} (${o.reasoning})\n`;
          });
        }
        await ctx.replyWithMarkdown(msg);
      }
    } catch (error) {
      console.error('Insights error:', error);
      await ctx.reply('Sorry, I encountered an error fetching insights.');
    }
  };

  bot.command('insights', handleInsights);
  bot.hears('💡 AI Insights', handleInsights);

  bot.command('services', async (ctx) => {
    await ctx.reply('Please choose an option:', getServiceKeyboard());
  });

  bot.hears('❓ Help', async (ctx) => {
    await ctx.reply(`
You can use the following commands:
/start - Start the bot
/help - Get help information
/mystocks - View your stock portfolio
/news - Get personalized market news
/report - Generate a comprehensive business report with charts
/sales - View recent sales performance and trends
/insights - View AI-generated business insights
/po - View and approve pending Purchase Orders
/forecast - Generate demand forecasts
/suppliers - View your suppliers
/sync - Sync your business data into the AI Vector Store
/cancel - Cancel current operation
/register - Register a new account
/login - Login to your account
/services - View available services
/auth - Authentication options

💡 *Tip:* You can ask me follow-up questions about any report, news, or chart I send you!
    `, { parse_mode: 'Markdown' });
  });

  bot.command('sync', async (ctx) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }
    
    await ctx.reply('🔄 Syncing your business data into the AI Vector Store. This may take a few moments...');
    try {
      await syncTenantEmbeddings(user.tenantId);
      await ctx.reply('✅ Sync complete! Your AI assistant now has deep, vectorized knowledge of your entire catalog and sales history.');
    } catch (error) {
      console.error('Sync error:', error);
      await ctx.reply('❌ Failed to sync data.');
    }
  });

  const handleForecasting = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) return ctx.reply('Please /login or /register first.');

    const ai = getAi();
    if (!ai) {
      await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      return;
    }

    await ctx.reply('🔮 Analyzing historical data to generate demand forecasts...');
    try {
      const items = await prisma.inventoryItem.findMany({
        where: { tenantId: user.tenantId },
        take: 5,
        orderBy: { currentStock: 'asc' }
      });

      if (items.length === 0) return ctx.reply('No inventory items found to forecast.');

      const prompt = `
        You are an Enterprise Demand Forecaster.
        Based on the following low-stock items for "${user.tenant.businessName}" (${user.tenant.businessType}), predict the demand for the next 30 days.
        Provide a professional, data-driven forecast in Markdown format.
        Items: ${JSON.stringify(items.map(i => ({ name: i.name, currentStock: i.currentStock, safetyStock: i.safetyStockLevel })))}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt
      });

      const myCtx = ctx as MyContext;
      myCtx.session = myCtx.session || { cursor: 0 };
      myCtx.session.chatHistory = myCtx.session.chatHistory || [];
      myCtx.session.chatHistory.push({ role: 'model', text: response.text || '' });

      await ctx.replyWithMarkdown(response.text || 'Failed to generate forecast.');
    } catch (error) {
      const err = error as Error;
      if (err?.message?.includes('API key not valid')) {
        await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      } else {
        console.error('Forecasting error:', error);
        await ctx.reply('Sorry, I encountered an error generating the forecast.');
      }
    }
  };

  bot.command('forecast', handleForecasting);
  bot.hears('🔮 Forecasting', handleForecasting);

  const handleSuppliers = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) return ctx.reply('Please /login or /register first.');

    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: user.tenantId },
      take: 10
    });

    if (suppliers.length === 0) return ctx.reply('No suppliers found in your account.');

    let msg = '🏭 *Your Suppliers:*\n\n';
    suppliers.forEach(s => {
      let contactEmail = 'N/A';
      let contactPhone = 'N/A';
      if (s.contactInfoJson) {
        try {
          const info = JSON.parse(s.contactInfoJson);
          contactEmail = info.email || 'N/A';
          contactPhone = info.phone || 'N/A';
        } catch {}
      }
      msg += `- *${s.name}*\n  Contact: ${contactEmail}\n  Phone: ${contactPhone}\n  Lead Time: ${s.leadTimeDays} days\n\n`;
    });

    await ctx.replyWithMarkdown(msg);
  };

  bot.command('suppliers', handleSuppliers);
  bot.hears('🏭 Suppliers', handleSuppliers);

  const handlePO = async (ctx: Context) => {
    if (!ctx.chat) return;
    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register first.');
      return;
    }

    const pendingPOs = await prisma.purchaseOrder.findMany({
      where: { tenantId: user.tenantId, status: 'PENDING_APPROVAL' },
      include: { item: true, supplier: true }
    });

    if (pendingPOs.length === 0) {
      await ctx.reply('✅ You have no pending purchase orders to approve.');
      return;
    }

    await ctx.reply(`📦 You have ${pendingPOs.length} pending Purchase Orders:`);

    for (const po of pendingPOs) {
      const message = `
*Item:* ${po.item.name} (SKU: ${po.item.sku})
*Supplier:* ${po.supplier.name}
*Quantity:* ${po.quantityOrdered}
*Total Cost:* $${(po.quantityOrdered * po.unitCost).toFixed(2)}
*Generated By:* ${po.createdBy === 'AI_AGENT' ? '🤖 AI Agent' : 'User'}
      `;

      await ctx.replyWithMarkdown(message, Markup.inlineKeyboard([
        Markup.button.callback('✅ Approve', `po_approve_${po.id}`),
        Markup.button.callback('❌ Reject', `po_reject_${po.id}`)
      ]));
    }
  };

  bot.command('po', handlePO);
  bot.hears('🛒 Purchase Orders', handlePO);

  bot.action(/po_(approve|reject)_(.+)/, async (ctx) => {
    const action = ctx.match[1];
    const poId = ctx.match[2];

    try {
      const updatedPO = await prisma.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          approvedAt: action === 'approve' ? new Date() : null
        },
        include: { item: true }
      });

      await ctx.editMessageText(`
*Item:* ${updatedPO.item.name}
*Status:* ${action === 'approve' ? '✅ APPROVED' : '❌ REJECTED'}
      `, { parse_mode: 'Markdown' });

      await ctx.answerCbQuery(`Purchase order ${action}d successfully.`);
    } catch (error) {
      console.error('Failed to update PO:', error);
      await ctx.answerCbQuery('Failed to update purchase order.');
    }
  });

  bot.on('message', async (ctx, next) => {
    if ('text' in ctx.message) {
      return next();
    }
    await ctx.reply('I can only process text messages right now. Please send a text query.');
  });

  // Handle general messages with AI (RAG Implementation)
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return; // Ignore other commands

    if (!text || text.length < 2) return;
    if (text.length > 500) {
      return await ctx.reply('⚠️ Your message is too long. Please keep it under 500 characters.');
    }

    const user = await getUserByChatId(ctx.chat.id);
    if (!user) {
      await ctx.reply('Please /login or /register to chat with the MSME Autopilot AI.');
      return;
    }

    const ai = getAi();
    if (!ai) {
      await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      return;
    }

    await ctx.sendChatAction('typing');

    try {
      const myCtx = ctx as MyContext;
      myCtx.session = myCtx.session || { cursor: 0 };
      myCtx.session.chatHistory = myCtx.session.chatHistory || [];
      
      // RAG: Retrieve relevant documents from the vector store
      const relevantDocs = await searchSimilarDocuments(user.tenantId, text, 8);
      
      const contextString = relevantDocs.length > 0 
        ? relevantDocs.map(d => `- ${d.content}`).join('\n')
        : 'No specific historical context found. Please run /sync if you recently added data.';

      const historyString = myCtx.session.chatHistory.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n');

      const prompt = `
        You are an expert MSME Autopilot AI assistant for a business named "${user.tenant.businessName}".
        The user asking is ${user.firstName} ${user.lastName}.
        
        [CONVERSATION HISTORY]
        ${historyString}
        [/CONVERSATION HISTORY]

        [RETRIEVED CONTEXT]
        ${contextString}
        [/RETRIEVED CONTEXT]
        
        User Query: "${text}"
        
        Provide a helpful, concise, and professional response. 
        If the user is asking a follow-up question or expressing doubt about a previous report, news, or chart, explain it clearly using the conversation history.
        Use the retrieved context to answer specific questions about their business. If the context doesn't contain the answer, politely state that you don't have that specific data.
        
        Guidelines:
        1. Be data-driven. Use numbers and SKUs from the context if available.
        2. Be proactive. If you see a problem (e.g., low stock), mention it.
        3. Maintain a professional yet approachable tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const replyText = response.text || 'I am unable to process that request right now.';
      
      myCtx.session.chatHistory.push({ role: 'user', text });
      myCtx.session.chatHistory.push({ role: 'model', text: replyText });
      if (myCtx.session.chatHistory.length > 10) {
        myCtx.session.chatHistory = myCtx.session.chatHistory.slice(-10);
      }

      await ctx.replyWithMarkdown(replyText);
    } catch (error) {
      const err = error as Error;
      if (err?.message?.includes('API key not valid')) {
        await ctx.reply('AI features are currently disabled because a valid Gemini API Key is not configured.');
      } else {
        console.error('AI Chat Error:', error);
        await ctx.reply('Sorry, I encountered an error processing your request.');
      }
    }
  });
}

export function startTelegramBot() {
  if (!bot) {
    console.warn('No TELEGRAM_BOT_TOKEN provided. Telegram bot will not start.');
    return;
  }

  initBotHandlers();

  // In the AI Studio dev environment, inbound requests are protected by an auth proxy.
  // Telegram webhooks will fail because Telegram doesn't have the required cookies.
  // Therefore, we must use long polling (bot.launch) which makes outbound requests.
  bot.telegram.deleteWebhook({ drop_pending_updates: true })
    .then(() => {
      console.log('> Telegram Webhook deleted. Starting with long polling...');
      return bot.launch();
    })
    .then(() => {
      console.log('> Telegram Bot started successfully with long polling.');
    })
    .catch(err => {
      console.error('> Telegram Bot failed to start:', err);
    });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
