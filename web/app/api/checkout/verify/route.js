import { NextResponse } from 'next/server';
import { fetchCashfreeOrder } from '@/lib/cashfree';
import { generateLicenseKey, readLicenses, saveLicenses } from '@/lib/license-manager';
import { readOrders, saveOrders } from '@/lib/order-manager';
import { recordCouponUsage } from '@/lib/coupon-manager';
import { sendLicenseEmail, sendAdminPurchaseAlert } from '@/lib/zeptomail';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body || {};

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      );
    }

    const orders = readOrders();
    const order = orders[orderId];

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    // If order was already fulfilled, return existing license key idempotently
    if (order.status === 'PAID' && order.licenseKey) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        orderId: order.orderId,
        licenseKey: order.licenseKey,
        email: order.customerEmail,
        customerName: order.customerName,
        amount: order.finalAmount,
        currency: order.currency,
        downloadUrl: 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'
      });
    }

    // Verify order with Cashfree
    let paymentSuccess = false;
    let cfDetails = null;

    if (order.isFree || order.finalAmount === 0 || order.paymentGateway?.startsWith('COUPON_')) {
      paymentSuccess = true;
    } else if (order.isMock) {
      // Mock simulation mode when API keys are unset
      paymentSuccess = true;
    } else {
      cfDetails = await fetchCashfreeOrder(orderId);
      const rawStatus = (cfDetails?.order_status || cfDetails?.orderStatus || '').toUpperCase();
      paymentSuccess = rawStatus === 'PAID' || rawStatus === 'SUCCESS';
    }

    if (!paymentSuccess) {
      const displayStatus = cfDetails?.order_status || cfDetails?.orderStatus || 'PENDING';
      return NextResponse.json(
        {
          success: false,
          message: `Payment has not been completed or was not approved by Cashfree (Status: ${displayStatus}).`,
          orderStatus: displayStatus
        },
        { status: 400 }
      );
    }

    // Generate commercial license key
    const licenseKey = generateLicenseKey();
    const licenses = readLicenses();

    const tier = order.currency === 'USD' ? 'USD_19' : 'INR_1600';
    let priceDisplay = order.currency === 'USD' ? '$19 USD' : '₹1,600 INR';
    if (order.couponCode) {
      priceDisplay = order.finalAmount === 0
        ? `Coupon: ${order.couponCode} (Free)`
        : `Coupon: ${order.couponCode} (${order.currency === 'USD' ? '$' : '₹'}${order.finalAmount})`;
    }

    const newLicense = {
      id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      licenseKey,
      assignedEmail: order.customerEmail,
      email: order.customerEmail,
      customerName: order.customerName,
      orderId: order.orderId,
      tier,
      price: priceDisplay,
      currency: order.currency,
      discountApplied: order.discountAmount || 0,
      finalAmount: order.finalAmount,
      isFree: Boolean(order.isFree || order.finalAmount === 0),
      couponCode: order.couponCode || null,
      status: 'unactivated',
      activeMachineId: null,
      createdAt: new Date().toISOString(),
      activatedAt: null,
      paymentGateway: order.isFree ? (order.couponCode ? `COUPON_${order.couponCode}` : 'FREE_PROMO') : (order.isMock ? 'CASHFREE_SIMULATED' : 'CASHFREE'),
      releaseHistory: []
    };

    licenses.unshift(newLicense);
    saveLicenses(licenses);

    // Update order status
    order.status = 'PAID';
    order.licenseKey = licenseKey;
    order.paidAt = new Date().toISOString();
    saveOrders(orders);

    // Record coupon usage if applicable
    if (order.couponCode) {
      recordCouponUsage(order.couponCode, {
        orderId: order.orderId,
        email: order.customerEmail,
        customerName: order.customerName,
        discountAmount: order.discountAmount || 0,
        finalAmount: order.finalAmount,
        currency: order.currency,
        licenseKey
      });
    }

    // Dispatch ZeptoMail license email to customer
    try {
      await sendLicenseEmail({
        toEmail: order.customerEmail,
        customerName: order.customerName,
        licenseKey,
        orderId: order.orderId,
        amount: order.finalAmount,
        currency: order.currency
      });
    } catch (mailErr) {
      console.error('Failed to send license email via ZeptoMail:', mailErr);
    }

    // Dispatch ZeptoMail purchase alert to Admin
    try {
      await sendAdminPurchaseAlert({
        orderId: order.orderId,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        licenseKey,
        amount: order.finalAmount,
        currency: order.currency,
        couponCode: order.couponCode,
        isFree: Boolean(order.isFree || order.finalAmount === 0),
        paymentGateway: order.paymentGateway || (order.isMock ? 'CASHFREE_SIMULATED' : 'CASHFREE')
      });
    } catch (adminMailErr) {
      console.error('Failed to send admin purchase alert via ZeptoMail:', adminMailErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      licenseKey,
      email: order.customerEmail,
      customerName: order.customerName,
      amount: order.finalAmount,
      currency: order.currency,
      downloadUrl: 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'
    });
  } catch (error) {
    console.error('Checkout verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
