import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/services/otpService';

export async function POST(req: Request) {
  try {
    const { phoneNumber, email, otp } = await req.json();

    if ((!phoneNumber && !email) || !otp) {
      return NextResponse.json({ error: 'Phone number/email and OTP are required' }, { status: 400 });
    }

    const target = phoneNumber || email;
    const isValid = verifyOtp(target, otp);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Success
    return NextResponse.json({ success: true, message: 'Verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
