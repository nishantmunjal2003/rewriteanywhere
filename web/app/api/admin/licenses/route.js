import { NextResponse } from 'next/server';
import { generateLicenseKey, readLicenses, saveLicenses } from '../../../../lib/license-manager';
import { getAdminSessionFromRequest } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const session = getAdminSessionFromRequest(request);
  return Boolean(session);
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in with Google as the authorized administrator.' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();

  let licenses = readLicenses();

  if (search) {
    licenses = licenses.filter((l) => {
      const key = (l.licenseKey || '').toLowerCase();
      const hwid = (l.activeMachineId || '').toLowerCase();
      const email = (l.assignedEmail || '').toLowerCase();
      const name = (l.customerName || '').toLowerCase();
      return key.includes(search) || hwid.includes(search) || email.includes(search) || name.includes(search);
    });
  }

  return NextResponse.json({ licenses, total: licenses.length });
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in with Google as the authorized administrator.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body || {};
    const licenses = readLicenses();

    // 1. ISSUE NEW PRODUCT KEY
    if (action === 'create') {
      const { tier = 'USD_19', email = '', customerName = '', notes = '', initialHwid = '' } = body;
      const key = generateLicenseKey();
      const isHwidProvided = initialHwid && initialHwid.trim().length > 0;
      const cleanHwid = isHwidProvided ? initialHwid.trim() : null;

      const newLicense = {
        licenseKey: key,
        tier: tier === 'INR_2000' ? 'INR_2000' : 'USD_19',
        price: tier === 'INR_2000' ? '₹2,000 INR' : '$19 USD',
        maxDevices: 1,
        activeMachineId: cleanHwid,
        status: cleanHwid ? 'active' : 'unactivated',
        createdAt: new Date().toISOString(),
        activatedAt: cleanHwid ? new Date().toISOString() : null,
        assignedEmail: email.trim() || null,
        customerName: customerName.trim() || null,
        notes: notes.trim() || null,
        releaseHistory: []
      };

      licenses.unshift(newLicense);
      saveLicenses(licenses);

      return NextResponse.json({
        success: true,
        message: 'Product key generated and issued successfully.',
        license: newLicense
      });
    }

    // 2. RELEASE / RESET HARDWARE BINDING (USING HWID OR LICENSE KEY)
    if (action === 'release') {
      const { licenseKey, hwid, reason = 'Admin HWID reset' } = body;

      let targetLicense = null;
      if (licenseKey) {
        const cleanKey = licenseKey.trim().toUpperCase();
        targetLicense = licenses.find((l) => l.licenseKey.toUpperCase() === cleanKey);
      } else if (hwid) {
        const cleanHwid = hwid.trim().toUpperCase();
        targetLicense = licenses.find((l) => (l.activeMachineId || '').toUpperCase() === cleanHwid);
      }

      if (!targetLicense) {
        return NextResponse.json(
          { success: false, message: 'No license found matching the provided License Key or Hardware Key (HWID).' },
          { status: 404 }
        );
      }

      const previousHwid = targetLicense.activeMachineId;
      targetLicense.activeMachineId = null;
      targetLicense.status = 'unactivated';
      targetLicense.releasedAt = new Date().toISOString();

      if (!targetLicense.releaseHistory) {
        targetLicense.releaseHistory = [];
      }
      targetLicense.releaseHistory.push({
        releasedHwid: previousHwid,
        timestamp: new Date().toISOString(),
        reason
      });

      saveLicenses(licenses);

      return NextResponse.json({
        success: true,
        message: `Successfully released Hardware Binding (${previousHwid || 'None'}). Key is now available for new PC activation.`,
        license: targetLicense
      });
    }

    // 3. MANUALLY BIND HARDWARE ID
    if (action === 'bind') {
      const { licenseKey, hwid } = body;
      if (!licenseKey || !hwid) {
        return NextResponse.json(
          { success: false, message: 'Both licenseKey and hwid are required to bind.' },
          { status: 400 }
        );
      }

      const cleanKey = licenseKey.trim().toUpperCase();
      const targetLicense = licenses.find((l) => l.licenseKey.toUpperCase() === cleanKey);

      if (!targetLicense) {
        return NextResponse.json({ success: false, message: 'License key not found.' }, { status: 404 });
      }

      targetLicense.activeMachineId = hwid.trim();
      targetLicense.status = 'active';
      targetLicense.activatedAt = new Date().toISOString();

      saveLicenses(licenses);

      return NextResponse.json({
        success: true,
        message: `Bound license ${cleanKey} to Hardware ID ${hwid}.`,
        license: targetLicense
      });
    }

    // 4. REVOKE / BLOCK LICENSE
    if (action === 'revoke') {
      const { licenseKey, reason = 'Refunded / Policy violation' } = body;
      const cleanKey = (licenseKey || '').trim().toUpperCase();
      const targetLicense = licenses.find((l) => l.licenseKey.toUpperCase() === cleanKey);

      if (!targetLicense) {
        return NextResponse.json({ success: false, message: 'License key not found.' }, { status: 404 });
      }

      targetLicense.status = 'revoked';
      targetLicense.activeMachineId = null;
      targetLicense.revokedAt = new Date().toISOString();
      targetLicense.revocationReason = reason;

      saveLicenses(licenses);

      return NextResponse.json({
        success: true,
        message: `License ${cleanKey} has been revoked.`,
        license: targetLicense
      });
    }

    // 5. DELETE RECORD
    if (action === 'delete') {
      const { licenseKey } = body;
      const cleanKey = (licenseKey || '').trim().toUpperCase();
      const index = licenses.findIndex((l) => l.licenseKey.toUpperCase() === cleanKey);

      if (index === -1) {
        return NextResponse.json({ success: false, message: 'License key not found.' }, { status: 404 });
      }

      const deleted = licenses.splice(index, 1);
      saveLicenses(licenses);

      return NextResponse.json({
        success: true,
        message: `License ${cleanKey} deleted from records.`,
        deleted: deleted[0]
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action requested.' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error in admin handler.' }, { status: 500 });
  }
}
