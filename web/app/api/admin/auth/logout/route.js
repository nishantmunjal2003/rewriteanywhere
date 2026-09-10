import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ success: true, message: 'Admin logged out successfully.' });

  response.cookies.set('arw_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });

  return response;
}
