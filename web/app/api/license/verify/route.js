import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readLicenses } from '@/lib/license-manager';

const HMAC_SECRET = process.env.LICENSE_HMAC_SECRET || 'arw-hmac-secret-token-key-2026';

export async function POST(request) {
  try {
    const body = await request.json();
    const { licenseKey, machineId } = body || {};

    if (!licenseKey || !machineId) {
      return NextResponse.json(
        { valid: false, message: 'Both licenseKey and machineId are required.' },
        { status: 400 }
      );
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const cleanHwid = machineId.trim().toUpperCase();

    if (process.env.NODE_ENV === 'development' && cleanKey === 'ARW-COMM-DEMO-2026-PASS') {
      return NextResponse.json({ valid: true, message: 'Valid demo commercial license.' });
    }

    const licenses = readLicenses();
    const license = licenses.find((l) => l.licenseKey.toUpperCase() === cleanKey);

    if (!license) {
      return NextResponse.json({ valid: false, message: 'License key not recognized.' }, { status: 404 });
    }

    if (license.status === 'revoked') {
      return NextResponse.json(
        { valid: false, message: 'This license has been revoked by administration.' },
        { status: 403 }
      );
    }

    if (!license.activeMachineId) {
      return NextResponse.json(
        { valid: false, message: 'License hardware binding has been released in Admin Panel. Reactivation required.' },
        { status: 403 }
      );
    }

    if (license.activeMachineId.toUpperCase() !== cleanHwid) {
      return NextResponse.json(
        { valid: false, message: 'License machine binding mismatch. Active on a different PC.' },
        { status: 403 }
      );
    }

    const signature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${cleanKey}:${cleanHwid}:${license.tier || 'USD_19'}`)
      .digest('hex');

    return NextResponse.json({
      valid: true,
      status: license.status,
      tier: license.tier,
      signature,
      message: 'License is valid and verified for this PC.'
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ valid: false, message: 'Internal server error.' }, { status: 500 });
  }
}
