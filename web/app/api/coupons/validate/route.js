import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupon-manager';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`coupon_val_${clientIp}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many coupon validation requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      );
    }

    const body = await request.json();
    const { code, amount, currency = 'INR' } = body || {};

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const originalAmount = parseFloat(amount) || (currency.toUpperCase() === 'USD' ? 19 : 1600);
    const result = validateCoupon(code, originalAmount, currency);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to validate coupon.' },
      { status: 500 }
    );
  }
}
