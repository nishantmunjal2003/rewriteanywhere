import { NextResponse } from 'next/server';
import { readCoupons, saveCoupons } from '@/lib/coupon-manager';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';

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

  const coupons = readCoupons();
  return NextResponse.json({ success: true, coupons });
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
    const {
      code,
      discountType = 'percentage',
      discountValue,
      maxUses = null,
      expiresAt = null,
      active = true
    } = body || {};

    if (!code || !discountValue || isNaN(discountValue) || Number(discountValue) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid coupon code and discount value are required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const coupons = readCoupons();

    const existingIndex = coupons.findIndex((c) => c.code.toUpperCase() === cleanCode);

    const couponRecord = {
      code: cleanCode,
      discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: parseFloat(discountValue),
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      usedCount: existingIndex >= 0 ? coupons[existingIndex].usedCount || 0 : 0,
      expiresAt: expiresAt || null,
      active: active !== false,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      coupons[existingIndex] = { ...coupons[existingIndex], ...couponRecord };
    } else {
      couponRecord.createdAt = new Date().toISOString();
      coupons.unshift(couponRecord);
    }

    saveCoupons(coupons);

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Coupon updated successfully.' : 'Coupon created successfully.',
      coupon: couponRecord
    });
  } catch (error) {
    console.error('Admin coupon create/update error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process coupon.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin login required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const coupons = readCoupons();
    const filtered = coupons.filter((c) => c.code.toUpperCase() !== cleanCode);

    if (filtered.length === coupons.length) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found.' },
        { status: 404 }
      );
    }

    saveCoupons(filtered);

    return NextResponse.json({
      success: true,
      message: `Coupon ${cleanCode} deleted.`
    });
  } catch (error) {
    console.error('Admin coupon delete error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete coupon.' },
      { status: 500 }
    );
  }
}
