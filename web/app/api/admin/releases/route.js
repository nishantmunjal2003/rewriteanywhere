import { NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';
import { readReleases, saveReleases, getActiveRelease, getAllCustomerEmails } from '@/lib/release-manager';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const session = getAdminSessionFromRequest(request);
  return Boolean(session);
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin login required.' },
      { status: 401 }
    );
  }

  try {
    const releases = readReleases();
    const activeRelease = getActiveRelease();
    const customers = getAllCustomerEmails();

    return NextResponse.json({
      success: true,
      releases,
      activeRelease,
      customerCount: customers.length,
      customers: customers.map(c => ({ email: c.email, name: c.name }))
    });
  } catch (error) {
    console.error('Error fetching admin releases:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve releases.' },
      { status: 500 }
    );
  }
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
    const { action, releaseId } = body || {};

    if (action === 'activate' && releaseId) {
      const releases = readReleases();
      let found = false;
      releases.forEach(r => {
        if (r.id === releaseId) {
          r.isActive = true;
          found = true;
        } else {
          r.isActive = false;
        }
      });

      if (!found) {
        return NextResponse.json(
          { success: false, message: 'Release not found.' },
          { status: 404 }
        );
      }

      saveReleases(releases);
      return NextResponse.json({
        success: true,
        message: 'Active release updated successfully.',
        releases,
        activeRelease: releases.find(r => r.isActive)
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error modifying admin release:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update release.' },
      { status: 500 }
    );
  }
}
