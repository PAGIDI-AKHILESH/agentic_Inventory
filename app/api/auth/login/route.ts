import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/db/repositories/UserRepository';
import { tenantRepository } from '@/lib/db/repositories/TenantRepository';
import { generateTokens } from '@/lib/core/auth';
import { AuditLogger } from '@/lib/governance/AuditLogger';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Login attempt for:', email);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('User found, comparing password');
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('Password match, fetching tenant:', user.tenantId);
    const tenant = await tenantRepository.findUnique(user.tenantId);

    console.log('Generating tokens');
    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    console.log('Logging audit event');
    AuditLogger.log({
      tenantId: user.tenantId,
      userId: user.id,
      actionType: 'USER_LOGGED_IN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    console.log('Login successful for:', email);

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: tenant?.businessName || 'Unknown Company'
      }, 
      tokens 
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ error: 'Internal server error', details: errorMessage, stack: errorStack }, { status: 500 });
  }
}
