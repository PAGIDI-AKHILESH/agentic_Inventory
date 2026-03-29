import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/core/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    // Fetch Agent Outputs
    const agentOutputs = await prisma.agentOutput.findMany({
      where: {
        tenantId: decoded.tenantId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Fetch Audit Logs for AI actions
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: decoded.tenantId,
        actionType: {
          startsWith: 'AI_'
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    });

    return NextResponse.json({
      success: true,
      agentOutputs,
      auditLogs
    });
  } catch (error) {
    console.error('Error fetching AI activity:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
