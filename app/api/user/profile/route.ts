import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/core/auth';
import { AuditLogger } from '@/lib/governance/AuditLogger';

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { firstName, lastName, email, phone, companyName } = await req.json();

    const userId = payload.userId;
    const tenantId = payload.tenantId;

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
      },
      include: {
        tenant: true,
      }
    });

    // Update Tenant (Company Name)
    if (companyName && updatedUser.tenant.businessName !== companyName) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          businessName: companyName,
        }
      });
      updatedUser.tenant.businessName = companyName;
    }

    AuditLogger.log({
      tenantId,
      userId,
      actionType: 'PROFILE_UPDATED',
      entityType: 'USER',
      entityId: userId,
      afterStateJson: { firstName, lastName, email, phone, companyName },
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Return the updated user data in the same format as login/me
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phoneNumber,
        companyName: updatedUser.tenant.businessName,
        tenant: updatedUser.tenant,
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
