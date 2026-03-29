import { Scenes, Markup, Context } from 'telegraf';
import { prisma } from '../db/prisma.ts';
import bcrypt from 'bcryptjs';
import Papa from 'papaparse';
import { sendOtp, verifyOtp } from '../services/otpService.ts';

export interface MyWizardSession extends Scenes.WizardSessionData {
  firstName?: string;
  lastName?: string;
  email?: string;
  emailOtp?: string;
  phone?: string;
  phoneOtp?: string;
  orgName?: string;
  category?: string;
  turnover?: string;
  integration?: string;
  erpName?: string;
  isForgotPassword?: boolean;
  resetEmail?: string;
  resetOtp?: string;
  loginOtp?: string;
  userId?: string;
}

export interface MySession extends Scenes.WizardSession<MyWizardSession> {
  chatHistory?: { role: string, text: string }[];
}

export interface MyContext extends Context {
  session: MySession;
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext> & { state: MyWizardSession };
}

// Registration Wizard
export const registerWizard = new Scenes.WizardScene<MyContext>(
  'register_wizard',
  async (ctx) => {
    await ctx.reply('Let\'s set up your account! What is your First Name?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    ctx.wizard.state.firstName = ctx.message.text;
    await ctx.reply('Great! What is your Last Name?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    ctx.wizard.state.lastName = ctx.message.text;
    await ctx.reply('Please enter your Email address:');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const email = ctx.message.text;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await ctx.reply('This email is already registered. Please /login instead.');
      return ctx.scene.leave();
    }
    ctx.wizard.state.email = email;
    await sendOtp(email, 'email');
    await ctx.reply(`An OTP has been sent to your email.\nPlease enter the OTP to verify your email (Hint: use 123456):`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const isValid = verifyOtp(ctx.wizard.state.email!, ctx.message.text);
    if (!isValid) {
      await ctx.reply('Invalid or expired OTP. Please try again or type /cancel to abort.');
      return;
    }
    await ctx.reply('Email verified successfully! Please enter your Phone Number:');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    ctx.wizard.state.phone = ctx.message.text;
    await sendOtp(ctx.wizard.state.phone, 'phone');
    await ctx.reply(`An OTP has been sent to your phone.\nPlease enter the OTP to verify your phone (Hint: use 123456):`);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const isValid = verifyOtp(ctx.wizard.state.phone!, ctx.message.text);
    if (!isValid) {
      await ctx.reply('Invalid or expired OTP. Please try again or type /cancel to abort.');
      return;
    }
    await ctx.reply('Phone verified successfully! What is the name of your Organization?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    ctx.wizard.state.orgName = ctx.message.text;
    await ctx.reply('Please select your Business Category:', Markup.keyboard([
      ['Retail', 'Manufacturing'],
      ['Services', 'Wholesale']
    ]).oneTime().resize());
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    ctx.wizard.state.category = ctx.message.text;
    await ctx.reply('What is your approximate annual turnover?', Markup.keyboard([
      ['< $100k', '$100k - $500k'],
      ['$500k - $1M', '> $1M']
    ]).oneTime().resize());
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    ctx.wizard.state.turnover = ctx.message.text;
    await ctx.reply('Please choose how you want to integrate your data:', Markup.keyboard([
      ['Upload Data', 'Integrate ERP']
    ]).oneTime().resize());
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const choice = ctx.message.text;
    if (choice !== 'Upload Data' && choice !== 'Integrate ERP') {
      await ctx.reply('Please select a valid option from the keyboard.');
      return;
    }
    ctx.wizard.state.integration = choice;
    if (choice === 'Upload Data') {
      await ctx.reply('Please upload your data file (CSV/Excel) now:', Markup.removeKeyboard());
    } else {
      await ctx.reply('Please enter the name of your ERP system (e.g., SAP, Oracle, Tally):', Markup.removeKeyboard());
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message) return;
    
    if (ctx.wizard.state.integration === 'Upload Data') {
      if (!('document' in ctx.message)) {
        await ctx.reply('Please upload a valid document file (CSV).');
        return;
      }
      
      const doc = ctx.message.document;
      if (doc.mime_type !== 'text/csv' && !doc.file_name?.endsWith('.csv')) {
        await ctx.reply('Please upload a CSV file.');
        return;
      }

      await ctx.reply('Processing your file...');
      try {
        const fileLink = await ctx.telegram.getFileLink(doc.file_id);
        const response = await fetch(fileLink.href);
        const csvText = await response.text();
        
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        if (parsed.errors.length > 0) {
          await ctx.reply('There were errors parsing your CSV file. Please ensure it is formatted correctly.');
          return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx.wizard.state as any).inventoryData = parsed.data;
        await ctx.reply(`Successfully parsed ${parsed.data.length} items from your file!`);
      } catch (error) {
        console.error('Error processing file:', error);
        await ctx.reply('Sorry, there was an error processing your file. Please try again.');
        return;
      }
    } else {
      if (!('text' in ctx.message)) {
        await ctx.reply('Please enter the name of your ERP system.');
        return;
      }
      ctx.wizard.state.erpName = ctx.message.text;
    }

    await ctx.reply('Finally, please create a password for your account:');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const password = ctx.message.text;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.wizard.state as any;
    
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Check if telegramChatId is already in use
      if (ctx.chat?.id) {
        const existingChat = await prisma.user.findUnique({ where: { telegramChatId: ctx.chat.id.toString() } });
        if (existingChat) {
          await prisma.user.update({
            where: { id: existingChat.id },
            data: { telegramChatId: null }
          });
        }
      }

      const tenant = await prisma.tenant.create({
        data: {
          businessName: state.orgName,
          businessType: state.category,
          settingsJson: JSON.stringify({ 
            turnover: state.turnover, 
            integration: state.integration,
            erpName: state.erpName 
          })
        }
      });

      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: state.email,
          firstName: state.firstName,
          lastName: state.lastName,
          phoneNumber: state.phone,
          passwordHash,
          telegramChatId: ctx.chat?.id.toString(),
          role: 'owner',
          isEmailVerified: true,
          isPhoneVerified: true
        }
      });

      if (state.inventoryData && Array.isArray(state.inventoryData)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const itemsToCreate = state.inventoryData.map((item: any) => ({
            tenantId: tenant.id,
            sku: item.sku || item.SKU || `SKU-${Math.random().toString(36).substring(7)}`,
            name: item.name || item.Name || item.Item || 'Unknown Item',
            category: item.category || item.Category || 'General',
            currentStock: parseInt(item.currentStock || item.stock || item.Stock || item.Quantity || '0', 10),
            reorderPoint: parseInt(item.reorderPoint || item.ReorderPoint || '10', 10),
            unitCost: parseFloat(item.unitCost || item.cost || item.Cost || '0'),
            sellingPrice: parseFloat(item.sellingPrice || item.price || item.Price || '0'),
            leadTimeDays: parseInt(item.leadTimeDays || item.LeadTime || '7', 10),
          }));

          await prisma.inventoryItem.createMany({
            data: itemsToCreate
          });
        } catch (err) {
          console.error('Error inserting inventory data:', err);
          // We don't fail registration if inventory upload fails, but we could notify them
        }
      }

      await ctx.reply('Registration complete! Welcome to MSME Autopilot.', Markup.keyboard([
        ['📦 My Stocks', '📰 Market News'],
        ['📊 Business Report', '🛒 Purchase Orders'],
        ['❓ Help', '🚪 Logout']
      ]).resize());
    } catch (error) {
      console.error('Registration error:', error);
      await ctx.reply('An error occurred during registration. Please try again later.');
    }
    
    return ctx.scene.leave();
  }
);

// Login Wizard
export const loginWizard = new Scenes.WizardScene<MyContext>(
  'login_wizard',
  async (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.wizard.state as any;
    if (state.isForgotPassword) {
      await ctx.reply('Please enter your email to reset your password:');
      // Skip to the step that expects the email for password reset
      ctx.wizard.selectStep(2);
      return;
    }
    await ctx.reply('Please enter your Email address (or type /forgot_password):');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const text = ctx.message.text;
    
    if (text === '/forgot_password') {
      await ctx.reply('Please enter your email to reset your password:');
      ctx.wizard.state.isForgotPassword = true;
      return ctx.wizard.next();
    }

    ctx.wizard.state.email = text;
    await ctx.reply('Please enter your Password:');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.wizard.state as any;

    if (state.isForgotPassword) {
      const email = ctx.message.text;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await ctx.reply('Email not found. Please try again or /cancel.');
        return ctx.scene.leave();
      }
      state.resetEmail = email;
      await sendOtp(email, 'email');
      await ctx.reply(`An OTP has been sent to your email.\nPlease enter the OTP to reset your password (Hint: use 123456):`);
      return ctx.wizard.next();
    }

    const password = ctx.message.text;
    const user = await prisma.user.findUnique({ where: { email: state.email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await ctx.reply('Invalid email or password. Please try again by typing /login.');
      return ctx.scene.leave();
    }

    // Check if we need OTP verification (every 3 logins)
    if (user.loginCount > 0 && user.loginCount % 3 === 0) {
      state.userId = user.id;
      await sendOtp(user.email, 'email');
      await ctx.reply(`For security, an OTP has been sent to your email.\nPlease enter the OTP to complete login (Hint: use 123456):`);
      return ctx.wizard.next();
    }

    // Normal login success
    if (ctx.chat?.id) {
      const existingChat = await prisma.user.findUnique({ where: { telegramChatId: ctx.chat.id.toString() } });
      if (existingChat && existingChat.id !== user.id) {
        await prisma.user.update({
          where: { id: existingChat.id },
          data: { telegramChatId: null }
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        telegramChatId: ctx.chat?.id.toString(),
        loginCount: { increment: 1 },
        lastLoginAt: new Date()
      }
    });

    await ctx.reply(`Welcome back, ${user.firstName}!`, Markup.keyboard([
      ['📦 My Stocks', '📰 Market News'],
      ['📊 Business Report', '🛒 Purchase Orders'],
      ['❓ Help', '🚪 Logout']
    ]).resize());
    return ctx.scene.leave();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.wizard.state as any;

    if (state.isForgotPassword) {
      const isValid = verifyOtp(state.resetEmail, ctx.message.text);
      if (!isValid) {
        await ctx.reply('Invalid or expired OTP. Password reset cancelled.');
        return ctx.scene.leave();
      }
      await ctx.reply('OTP verified! Please enter your new password:');
      return ctx.wizard.next();
    }

    // Login OTP verification
    const user = await prisma.user.findUnique({ where: { id: state.userId } });
    if (!user) {
      await ctx.reply('User not found.');
      return ctx.scene.leave();
    }
    const isValid = verifyOtp(user.email, ctx.message.text);
    if (!isValid) {
      await ctx.reply('Invalid or expired OTP. Login cancelled.');
      return ctx.scene.leave();
    }

    if (ctx.chat?.id) {
      const existingChat = await prisma.user.findUnique({ where: { telegramChatId: ctx.chat.id.toString() } });
      if (existingChat && existingChat.id !== state.userId) {
        await prisma.user.update({
          where: { id: existingChat.id },
          data: { telegramChatId: null }
        });
      }
    }

    await prisma.user.update({
      where: { id: state.userId },
      data: { 
        telegramChatId: ctx.chat?.id.toString(),
        loginCount: { increment: 1 },
        lastLoginAt: new Date()
      }
    });

    await ctx.reply('Login successful!', Markup.keyboard([
      ['📦 My Stocks', '📰 Market News'],
      ['📊 Business Report', '🛒 Purchase Orders'],
      ['❓ Help', '🚪 Logout']
    ]).resize());
    return ctx.scene.leave();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = ctx.wizard.state as any;

    if (state.isForgotPassword) {
      const newPassword = ctx.message.text;
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email: state.resetEmail },
        data: { passwordHash }
      });
      await ctx.reply('Password reset successfully! You can now /login.');
      return ctx.scene.leave();
    }
  }
);
