import { NextResponse } from 'next/server';
import { verifyAndConsumeOtp, createCustomerSessionToken } from '@/lib/user-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`otp_verify_${clientIp}`, { limit: 10, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please wait a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, otp } = body || {};

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const verifyResult = verifyAndConsumeOtp(email, otp);
    if (!verifyResult.valid) {
      return NextResponse.json(
        { success: false, message: verifyResult.message },
        { status: 400 }
      );
    }

    const sessionToken = createCustomerSessionToken(verifyResult.email);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      email: verifyResult.email
    });

    response.cookies.set('arw_user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify code.' },
      { status: 500 }
    );
  }
}
