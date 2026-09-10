import { NextResponse } from 'next/server';
import { verifyAndConsumeOtp, createCustomerSessionToken } from '@/lib/user-auth';

export async function POST(request) {
  try {
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
      sameSite: 'lax',
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
