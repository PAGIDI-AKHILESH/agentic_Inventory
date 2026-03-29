// In a real application, this would use Redis or a database to store the OTP temporarily
// For this demo, we'll use a simple in-memory store. Note: In serverless environments, 
// this might reset between requests, but it works for a prototype.

const globalForOtp = globalThis as unknown as {
  otpStore: Map<string, { otp: string, expiresAt: number }>;
};

export const otpStore = globalForOtp.otpStore || new Map<string, { otp: string, expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore;
}
