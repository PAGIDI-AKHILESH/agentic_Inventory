import { NextResponse } from 'next/server';
import { bot, initBotHandlers } from '@/lib/telegram/bot';

// Required for Telegraf webhook handling on Vercel
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!bot) {
      console.warn('Telegram bot is not initialized. No TELEGRAM_BOT_TOKEN provided.');
      return NextResponse.json({ ok: true });
    }

    // Initialize handlers once (safe due to globalThis guard in bot.ts)
    initBotHandlers();

    const body = await req.json();
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
