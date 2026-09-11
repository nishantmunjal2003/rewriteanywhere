import { NextResponse } from 'next/server';
import { generateAndSaveOtp } from '@/lib/user-auth';
import { sendOtpEmail } from '@/lib/zeptomail';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`otp_send_${clientIp}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many OTP requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body || {};

    if (!email || !email.includes('@') || email.length > 120) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpResult = generateAndSaveOtp(cleanEmail);

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, message: otpResult.message || 'Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    const emailResult = await sendOtpEmail({ toEmail: cleanEmail, otpCode: otpResult.code });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: emailResult.error || 'Failed to dispatch verification email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
