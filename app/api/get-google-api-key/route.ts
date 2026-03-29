import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'NOT SET',
  });
}
