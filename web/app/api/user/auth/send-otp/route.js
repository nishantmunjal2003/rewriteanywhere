import { NextResponse } from 'next/server';
import { generateAndSaveOtp } from '@/lib/user-auth';
import { sendOtpEmail } from '@/lib/zeptomail';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const otpCode = generateAndSaveOtp(cleanEmail);

    const emailResult = await sendOtpEmail({ toEmail: cleanEmail, otpCode });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: emailResult.error || 'Failed to dispatch verification email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
      isMockEmail: Boolean(emailResult.isMock)
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
