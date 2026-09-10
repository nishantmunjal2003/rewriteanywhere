import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchCashfreeOrder } from '@/lib/cashfree';
import { generateLicenseKey, readLicenses, saveLicenses } from '@/lib/license-manager';
import { recordCouponUsage } from '@/lib/coupon-manager';
import { sendLicenseEmail } from '@/lib/zeptomail';

function getOrdersPath() {
  return path.join(process.cwd(), 'data', 'orders.json');
}

function readOrders() {
  try {
    const p = getOrdersPath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('Error reading orders:', e);
  }
  return {};
}

function saveOrders(orders) {
  try {
    const p = getOrdersPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(orders, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving orders:', e);
  }
}

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

    if (order.isMock) {
      // Mock simulation mode when API keys are unset
      paymentSuccess = true;
    } else {
      cfDetails = await fetchCashfreeOrder(orderId);
      paymentSuccess = cfDetails && (cfDetails.orderStatus === 'PAID' || cfDetails.orderStatus === 'SUCCESS');
    }

    if (!paymentSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment has not been completed or was not approved by Cashfree.',
          orderStatus: cfDetails ? cfDetails.orderStatus : 'PENDING'
        },
        { status: 400 }
      );
    }

    // Generate commercial license key
    const licenseKey = generateLicenseKey();
    const licenses = readLicenses();

    const newLicense = {
      id: `lic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      licenseKey,
      assignedEmail: order.customerEmail,
      email: order.customerEmail,
      customerName: order.customerName,
      orderId: order.orderId,
      tier: order.currency === 'USD' ? 'COMMERCIAL_USD' : 'COMMERCIAL_INR',
      price: order.finalAmount,
      currency: order.currency,
      discountApplied: order.discountAmount || 0,
      couponCode: order.couponCode || null,
      status: 'issued',
      activeMachineId: null,
      createdAt: new Date().toISOString(),
      paymentGateway: order.isMock ? 'CASHFREE_SIMULATED' : 'CASHFREE'
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
      recordCouponUsage(order.couponCode);
    }

    // Dispatch ZeptoMail license email
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
