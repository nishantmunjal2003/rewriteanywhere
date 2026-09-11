import { NextResponse } from 'next/server';
import { verifyGoogleIdToken, createSessionToken } from '../../../../../lib/admin-auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { idToken } = body || {};

    if (!idToken) {
      return NextResponse.json({ success: false, message: 'Missing Google ID token.' }, { status: 400 });
    }

    const verification = await verifyGoogleIdToken(idToken);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.error || 'Unauthorized Google account.' },
        { status: 403 }
      );
    }

    const sessionToken = createSessionToken(verification.user);

    const response = NextResponse.json({
      success: true,
      message: 'Admin session authenticated successfully.',
      user: verification.user
    });

    // Set secure HttpOnly cookie for the session (7 days)
    response.cookies.set('arw_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error('Google Admin Auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
