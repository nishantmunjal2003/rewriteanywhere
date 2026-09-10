import fs from 'fs';
import path from 'path';

export const SEED_ORDERS = {
  'ARW_1789031829128_Z6ZDX': {
    orderId: 'ARW_1789031829128_Z6ZDX',
    customerEmail: 'nishant@gkv.ac.in',
    customerName: 'Dr. Nishant Munjal',
    customerPhone: '9999999999',
    currency: 'INR',
    basePrice: 1600,
    discountAmount: 0,
    finalAmount: 1600,
    couponCode: null,
    status: 'PAID',
    licenseKey: 'ARW-MZD9-36TE-KUX6-MP44',
    createdAt: '2026-09-10T09:20:00.000Z',
    paidAt: '2026-09-10T09:24:00.000Z'
  }
};

export function getOrdersPath() {
  return path.join(process.cwd(), 'data', 'orders.json');
}

export function readOrders() {
  let orders = {};
  try {
    const p = getOrdersPath();
    if (fs.existsSync(p)) {
      orders = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading orders.json:', e);
  }

  let changed = false;
  for (const [orderId, seedOrder] of Object.entries(SEED_ORDERS)) {
    if (!orders[orderId]) {
      orders[orderId] = seedOrder;
      changed = true;
    }
  }

  if (changed) {
    saveOrders(orders);
  }

  return orders;
}

export function saveOrders(orders) {
  try {
    const p = getOrdersPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(p, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving orders.json:', e);
    return false;
  }
}
