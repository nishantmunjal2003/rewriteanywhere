import { NextResponse } from 'next/server';
import { createCashfreeOrder } from '@/lib/cashfree';
import { validateCoupon, recordCouponUsage } from '@/lib/coupon-manager';
import { readOrders, saveOrders } from '@/lib/order-manager';
import { generateLicenseKey, readLicenses, saveLicenses } from '@/lib/license-manager';
import { sendLicenseEmail, sendAdminPurchaseAlert } from '@/lib/zeptomail';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`order_create_${clientIp}`, { limit: 10, windowMs: 5 * 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many order requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, name = 'Customer', phone = '9999999999', currency = 'INR', couponCode = '' } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 120) {
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

    // Free order (100% discount coupon) - Bypass Cashfree PG entirely
    if (finalAmount <= 0) {
      const licenseKey = generateLicenseKey();
      const licenses = readLicenses();
      const tier = cur === 'USD' ? 'USD_19' : 'INR_1600';
      const originalPriceText = cur === 'USD' ? '$19 USD' : '₹1,600 INR';

      const newLicense = {
        id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        licenseKey,
        assignedEmail: email.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        customerName: name.trim(),
        orderId,
        tier,
        price: validCoupon ? `Coupon: ${validCoupon} (Free)` : 'Free Promotion',
        originalPrice: originalPriceText,
        currency: cur,
        discountApplied: discountAmount,
        finalAmount: 0,
        isFree: true,
        couponCode: validCoupon || null,
        status: 'unactivated',
        activeMachineId: null,
        createdAt: new Date().toISOString(),
        activatedAt: null,
        paymentGateway: validCoupon ? `COUPON_${validCoupon}` : 'FREE_PROMO',
        releaseHistory: []
      };

      licenses.unshift(newLicense);
      saveLicenses(licenses);

      // Save fulfilled order record
      const orders = readOrders();
      orders[orderId] = {
        orderId,
        customerEmail: email.toLowerCase().trim(),
        customerName: name.trim(),
        customerPhone: phone,
        currency: cur,
        basePrice,
        discountAmount,
        finalAmount: 0,
        couponCode: validCoupon,
        licenseKey,
        status: 'PAID',
        isFree: true,
        isMock: false,
        paymentGateway: validCoupon ? `COUPON_${validCoupon}` : 'FREE_PROMO',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      saveOrders(orders);

      if (validCoupon) {
        recordCouponUsage(validCoupon, {
          orderId,
          email,
          customerName: name,
          discountAmount,
          finalAmount: 0,
          currency: cur,
          licenseKey
        });
      }

      // Dispatch ZeptoMail license email asynchronously
      try {
        await sendLicenseEmail({
          toEmail: email.toLowerCase().trim(),
          customerName: name.trim(),
          licenseKey,
          orderId,
          amount: 0,
          currency: cur
        });
      } catch (mailErr) {
        console.error('Failed to send free license email via ZeptoMail:', mailErr);
      }

      // Dispatch ZeptoMail purchase alert to Admin
      try {
        await sendAdminPurchaseAlert({
          orderId,
          customerEmail: email.toLowerCase().trim(),
          customerName: name.trim(),
          customerPhone: phone,
          licenseKey,
          amount: 0,
          currency: cur,
          couponCode: validCoupon,
          isFree: true,
          paymentGateway: validCoupon ? `COUPON_${validCoupon}` : 'FREE_PROMO'
        });
      } catch (adminMailErr) {
        console.error('Failed to send admin alert email via ZeptoMail:', adminMailErr);
      }

      return NextResponse.json({
        success: true,
        isFree: true,
        orderId,
        licenseKey,
        orderAmount: 0,
        orderCurrency: cur,
        discountAmount
      });
    }

    // Create Cashfree order for paid orders (> 0)
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
