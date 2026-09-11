import { NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';
import { readReleases, recordBroadcast, getAllCustomerEmails } from '@/lib/release-manager';
import { sendReleaseUpdateEmail } from '@/lib/zeptomail';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const session = getAdminSessionFromRequest(request);
  return Boolean(session);
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin login required.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { releaseId } = body || {};

    const releases = readReleases();
    const release = releaseId
      ? releases.find(r => r.id === releaseId) || releases.find(r => r.isActive) || releases[0]
      : releases.find(r => r.isActive) || releases[0];

    if (!release) {
      return NextResponse.json(
        { success: false, message: 'No release found to broadcast.' },
        { status: 404 }
      );
    }

    const customers = getAllCustomerEmails();
    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No licensed customers found to email.' },
        { status: 400 }
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const customer of customers) {
      try {
        const result = await sendReleaseUpdateEmail({
          toEmail: customer.email,
          customerName: customer.name || 'Valued Customer',
          version: release.version,
          notes: release.notes,
          downloadUrl: release.downloadUrl || 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'
        });

        if (result && result.success) {
          sentCount++;
        } else {
          failedCount++;
          errors.push({ email: customer.email, error: result?.error || 'Unknown ZeptoMail error' });
        }
      } catch (err) {
        failedCount++;
        errors.push({ email: customer.email, error: err.message });
      }
    }

    recordBroadcast(release.id, sentCount);

    return NextResponse.json({
      success: true,
      message: `Update broadcast finished: ${sentCount} sent successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
      sentCount,
      failedCount,
      totalCustomers: customers.length,
      errors: errors.slice(0, 5)
    });
  } catch (error) {
    console.error('Error broadcasting release update:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to dispatch update emails.' },
      { status: 500 }
    );
  }
}
