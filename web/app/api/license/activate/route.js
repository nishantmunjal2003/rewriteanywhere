import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { readLicenses, saveLicenses } from '@/lib/license-manager';

const KEY_REGEX = /^ARW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
const HMAC_SECRET = process.env.LICENSE_HMAC_SECRET || 'arw-hmac-secret-token-key-2026';

export async function POST(request) {
  try {
    const body = await request.json();
    const { licenseKey, machineId } = body || {};

    if (!licenseKey || !KEY_REGEX.test(licenseKey.trim())) {
      return NextResponse.json(
        { success: false, message: 'Invalid license key format. Expected ARW-XXXX-XXXX-XXXX-XXXX.' },
        { status: 400 }
      );
    }

    if (!machineId) {
      return NextResponse.json(
        { success: false, message: 'Missing hardware identifier (machineId).' },
        { status: 400 }
      );
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const cleanHwid = machineId.trim().toUpperCase();

    // Check offline demo key (restricted to development environment)
    if (process.env.NODE_ENV === 'development' && cleanKey === 'ARW-COMM-DEMO-2026-PASS') {
      const signature = crypto.createHmac('sha256', HMAC_SECRET).update(`${cleanKey}:${cleanHwid}:DEMO`).digest('hex');
      return NextResponse.json({
        success: true,
        message: 'Demo commercial license activated successfully.',
        licenseKey: cleanKey,
        tier: 'DEMO',
        signature
      });
    }

    const licenses = readLicenses();
    const license = licenses.find((l) => l.licenseKey.toUpperCase() === cleanKey);

    if (!license) {
      return NextResponse.json(
        { success: false, message: 'Invalid license key. This key does not exist in our licensing records. Please check your admin panel or purchase email.' },
        { status: 404 }
      );
    }

    // Check if revoked
    if (license.status === 'revoked') {
      return NextResponse.json(
        { success: false, message: 'This license key has been revoked (Refunded or Cancelled).' },
        { status: 403 }
      );
    }

    // Check hardware binding (Single PC policy)
    if (license.activeMachineId && license.activeMachineId.toUpperCase() !== cleanHwid) {
      return NextResponse.json(
        {
          success: false,
          message: `This license is already bound to another PC (${license.activeMachineId}). Single-PC policy enforced. Please release the hardware lock in your Admin Panel before activating on this PC.`
        },
        { status: 403 }
      );
    }

    // Bind machine
    license.activeMachineId = cleanHwid;
    license.status = 'active';
    license.activatedAt = new Date().toISOString();

    saveLicenses(licenses);

    const signature = crypto
      .createHmac('sha256', HMAC_SECRET)
      .update(`${cleanKey}:${cleanHwid}:${license.tier || 'USD_19'}`)
      .digest('hex');

    return NextResponse.json({
      success: true,
      message: 'License successfully verified online and bound to your Windows PC.',
      licenseKey: cleanKey,
      tier: license.tier,
      price: license.price,
      signature
    });
  } catch (error) {
    console.error('Activation API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during license activation.' },
      { status: 500 }
    );
  }
}
