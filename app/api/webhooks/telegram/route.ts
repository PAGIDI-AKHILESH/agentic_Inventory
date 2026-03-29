import { NextResponse } from 'next/server';
import { bot, initBotHandlers } from '@/lib/telegram/bot';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (bot) {
      initBotHandlers();
      await bot.handleUpdate(body);
    } else {
      console.warn('Telegram bot is not initialized. Webhook received but ignored.');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
