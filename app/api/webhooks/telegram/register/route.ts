import { NextResponse } from 'next/server';

/**
 * GET /api/webhooks/telegram/register
 * Call this endpoint ONCE after deployment to register the Telegram webhook.
 * It tells Telegram to send all bot updates to your Vercel deployment URL.
 */
export async function GET(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  // Use host header to construct the APP_URL automatically!
  const host = req.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  let appUrl = process.env.APP_URL;

  if (!appUrl || appUrl.includes('localhost')) {
      if (host) {
          appUrl = `https://${host}`;
      } else {
          return NextResponse.json({ error: 'APP_URL not configured and host unavailable' }, { status: 500 });
      }
  }

  // Force HTTPS if it accidentally contains http://
  if (appUrl.startsWith('http://') && !appUrl.includes('localhost')) {
      appUrl = appUrl.replace('http://', 'https://');
  }

  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
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
