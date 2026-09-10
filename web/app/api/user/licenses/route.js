import { NextResponse } from 'next/server';
import { verifyCustomerSessionToken } from '@/lib/user-auth';
import { readLicenses } from '@/lib/license-manager';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const sessionCookie = request.cookies.get('arw_user_session')?.value;
    const session = verifyCustomerSessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in with your email verification code.' },
        { status: 401 }
      );
    }

    const userEmail = session.email.toLowerCase().trim();
    const allLicenses = readLicenses();

    // Filter licenses purchased by or assigned to this email
    const userLicenses = allLicenses.filter((lic) => {
      const assigned = (lic.assignedEmail || '').toLowerCase().trim();
      const direct = (lic.email || '').toLowerCase().trim();
      return assigned === userEmail || direct === userEmail;
    });

    return NextResponse.json({
      success: true,
      email: userEmail,
      licenses: userLicenses,
      downloads: {
        exeUrl: 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe',
        zipUrl: 'https://rewriteanywhere.nishantmunjal.com/downloads/installer.zip',
        version: 'v1.0.0-PROD',
        os: 'Windows 10 / 11 (64-bit)'
      }
    });
  } catch (error) {
    console.error('User licenses fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve your licenses.' },
      { status: 500 }
    );
  }
}
