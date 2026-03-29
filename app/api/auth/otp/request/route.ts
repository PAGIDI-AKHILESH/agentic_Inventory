import { NextResponse } from 'next/server';
import { sendOtp } from '@/lib/services/otpService';

export async function POST(req: Request) {
  try {
    const { phoneNumber, email } = await req.json();

    if (!phoneNumber && !email) {
      return NextResponse.json({ error: 'Phone number or email is required' }, { status: 400 });
    }

    const target = phoneNumber || email;
    const type = phoneNumber ? 'phone' : 'email';
    
    await sendOtp(target, type);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully.' 
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
