import { NextResponse } from 'next/server';

/**
 * GET /api/webhooks/telegram/register
 * Call this endpoint ONCE after deployment to register the Telegram webhook.
 * It tells Telegram to send all bot updates to your Vercel deployment URL.
 */
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.APP_URL;

  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }
  if (!appUrl) {
    return NextResponse.json({ error: 'APP_URL not configured' }, { status: 500 });
  }

  const webhookUrl = `${appUrl}/api/webhooks/telegram`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: true,
        }),
      }
    );

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: `Telegram webhook registered at: ${webhookUrl}`,
        result,
      });
    } else {
      return NextResponse.json({ success: false, error: result.description, result }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to register Telegram webhook:', error);
    return NextResponse.json({ error: 'Failed to register webhook' }, { status: 500 });
  }
}
