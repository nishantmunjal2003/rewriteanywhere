// Cashfree Payments PG API Helper (API version 2023-08-01)

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();

const BASE_URL =
  CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export function getCashfreeConfig() {
  return {
    appId: CASHFREE_APP_ID,
    isConfigured: Boolean(CASHFREE_APP_ID && CASHFREE_SECRET_KEY),
    env: CASHFREE_ENV,
    baseUrl: BASE_URL
  };
}

/**
 * Creates an order in Cashfree Payment Gateway
 */
export async function createCashfreeOrder({
  orderId,
  orderAmount,
  orderCurrency = 'INR',
  customerEmail,
  customerPhone = '9999999999',
  customerName = 'Customer',
  returnUrl,
  notifyUrl
}) {
  const cleanPhone = (customerPhone || '9999999999').replace(/[^0-9]/g, '') || '9999999999';
  const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // If Cashfree credentials are not configured yet, return a mock order in sandbox
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    console.warn('Cashfree credentials not set in environment. Running in mock simulation mode.');
    return {
      success: true,
      isMock: true,
      orderId,
      orderAmount,
      orderCurrency,
      paymentSessionId: `mock_session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    };
  }

  const payload = {
    order_id: orderId,
    order_amount: parseFloat(orderAmount.toFixed(2)),
    order_currency: orderCurrency.toUpperCase(),
    customer_details: {
      customer_id: customerId,
      customer_email: customerEmail.toLowerCase().trim(),
      customer_phone: cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '9999999999',
      customer_name: customerName.trim() || 'Customer'
    },
    order_meta: {
      return_url: returnUrl || `https://rewriteanywhere.nishantmunjal.com/checkout/success?order_id=${orderId}`,
      notify_url: notifyUrl || `https://rewriteanywhere.nishantmunjal.com/api/checkout/webhook`
    },
    order_note: 'AI Rewrite Anywhere Lifetime Commercial License'
  };

  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Cashfree order creation error:', data);
    throw new Error(data.message || 'Failed to create payment order with Cashfree.');
  }

  return {
    success: true,
    isMock: false,
    orderId: data.order_id,
    orderAmount: data.order_amount,
    orderCurrency: data.order_currency,
    paymentSessionId: data.payment_session_id,
    orderStatus: data.order_status
  };
}

/**
 * Fetches order details and payment status from Cashfree
 */
export async function fetchCashfreeOrder(orderId) {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    // In mock simulation mode, treat as PAID for testing if requested
    return {
      isMock: true,
      order_id: orderId,
      order_status: 'PAID'
    };
  }

  const response = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to fetch order details for ${orderId}`);
  }

  return data;
}
