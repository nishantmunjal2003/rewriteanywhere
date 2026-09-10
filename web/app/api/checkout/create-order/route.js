import { NextResponse } from 'next/server';
import { createCashfreeOrder } from '@/lib/cashfree';
import { validateCoupon } from '@/lib/coupon-manager';
import { readOrders, saveOrders } from '@/lib/order-manager';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name = 'Customer', phone = '9999999999', currency = 'INR', couponCode = '' } = body || {};

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cur = (currency || 'INR').toUpperCase();
    const basePrice = cur === 'USD' ? 19 : 1600;
    let finalAmount = basePrice;
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode && couponCode.trim()) {
      const couponCheck = validateCoupon(couponCode, basePrice, cur);
      if (couponCheck.valid) {
        discountAmount = couponCheck.discountAmount;
        finalAmount = couponCheck.finalAmount;
        validCoupon = couponCheck.code;
      }
    }

    const orderId = `ARW_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create Cashfree order
    const cashfreeRes = await createCashfreeOrder({
      orderId,
      orderAmount: finalAmount,
      orderCurrency: cur,
      customerEmail: email,
      customerPhone: phone,
      customerName: name,
      returnUrl: `https://rewriteanywhere.nishantmunjal.com/checkout/success?order_id=${orderId}`
    });

    // Save pending order record
    const orders = readOrders();
    orders[orderId] = {
      orderId,
      customerEmail: email.toLowerCase().trim(),
      customerName: name.trim(),
      customerPhone: phone,
      currency: cur,
      basePrice,
      discountAmount,
      finalAmount,
      couponCode: validCoupon,
      paymentSessionId: cashfreeRes.paymentSessionId,
      status: 'PENDING',
      isMock: Boolean(cashfreeRes.isMock),
      createdAt: new Date().toISOString()
    };
    saveOrders(orders);

    return NextResponse.json({
      success: true,
      orderId,
      orderAmount: finalAmount,
      orderCurrency: cur,
      discountAmount,
      paymentSessionId: cashfreeRes.paymentSessionId,
      isMock: Boolean(cashfreeRes.isMock)
    });
  } catch (error) {
    console.error('Checkout create-order error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to initialize payment order.' },
      { status: 500 }
    );
  }
}
