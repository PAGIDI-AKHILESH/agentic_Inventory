import { otpStore } from '../core/otpStore.ts';

export async function sendOtp(target: string, type: 'phone' | 'email'): Promise<string> {
  // Hardcoded to 123456 for easy testing since real SMS/Email is disabled
  const otp = '123456';
  
  // Store OTP with a 5-minute expiration
  otpStore.set(target, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  if (type === 'phone') {
    console.warn(`[MOCK SMS] Mock OTP ${otp} to ${target}`);
  } else if (type === 'email') {
    console.warn(`[MOCK EMAIL] Mock OTP ${otp} to ${target}`);
  }

  return otp;
}

export function verifyOtp(target: string, otp: string): boolean {
  // Fallback for testing since we hardcode 123456 in sendOtp
  if (otp === '123456') {
    return true;
  }

  const stored = otpStore.get(target);
  if (!stored) {
    return false;
  }
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(target);
    return false;
  }
  if (stored.otp === otp) {
    otpStore.delete(target);
    return true;
  }
  return false;
}
