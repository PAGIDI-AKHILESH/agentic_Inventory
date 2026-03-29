import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      counts: {
        users: userCount,
        tenants: tenantCount
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ 
      status: 'error', 
      message: err.message || String(error),
      stack: err.stack
    }, { status: 500 });
  }
}
