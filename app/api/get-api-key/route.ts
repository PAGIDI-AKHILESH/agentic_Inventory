import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    API_KEY: process.env.API_KEY || 'NOT SET',
  });
}
