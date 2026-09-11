import fs from 'fs';
import path from 'path';

export const SEED_COUPONS = [
  {
    code: 'L100',
    discountType: 'percentage',
    discountValue: 100,
    maxUses: null,
    usedCount: 0,
    active: true,
    createdAt: '2026-09-11T00:00:00.000Z',
    usageHistory: []
  },
  {
    code: 'LAUNCH50',
    discountType: 'percentage',
    discountValue: 50,
    maxUses: 100,
    usedCount: 0,
    active: true,
    createdAt: '2026-09-10T00:00:00.000Z',
    usageHistory: []
  }
];

function getCouponsPath() {
  return path.join(process.cwd(), 'data', 'coupons.json');
}

export function readCoupons() {
  let diskCoupons = [];
  try {
    const filePath = getCouponsPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      diskCoupons = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading coupons.json:', err);
  }

  const map = new Map();
  for (const c of diskCoupons) {
    if (c && c.code) {
      if (!Array.isArray(c.usageHistory)) {
        c.usageHistory = [];
      }
      map.set(c.code.toUpperCase(), c);
    }
  }

  // Merge seed coupons if missing
  let changed = false;
  for (const seed of SEED_COUPONS) {
    const key = seed.code.toUpperCase();
    if (!map.has(key)) {
      map.set(key, { ...seed, usageHistory: [] });
      changed = true;
    }
  }

  const merged = Array.from(map.values());
  if (changed || diskCoupons.length === 0) {
    saveCoupons(merged);
  }

  return merged;
}

export function saveCoupons(coupons) {
  try {
    const filePath = getCouponsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(coupons, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving coupons.json:', err);
    return false;
  }
}

/**
 * Validates a coupon code against an order amount and returns the discount
 */
export function validateCoupon(code, originalAmount, currency = 'inr') {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupons = readCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code.' };
  }

  if (!coupon.active) {
    return { valid: false, message: 'This coupon is currently inactive.' };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, message: 'This coupon has expired.' };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'This coupon has reached its maximum usage limit.' };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (originalAmount * coupon.discountValue) / 100;
  } else {
    // Fixed discount
    discountAmount = coupon.discountValue;
  }

  // Cap discount to not exceed original amount
  discountAmount = Math.min(discountAmount, originalAmount);
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    valid: true,
    code: cleanCode,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalAmount: parseFloat(finalAmount.toFixed(2)),
    message: `Coupon ${cleanCode} applied! You saved ${discountAmount.toFixed(2)}.`
  };
}

/**
 * Increments usage count of a coupon and records detailed redemption history
 */
export function recordCouponUsage(code, details = {}) {
  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();
  const coupons = readCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);
  if (coupon) {
    if (!Array.isArray(coupon.usageHistory)) {
      coupon.usageHistory = [];
    }

    const orderId = details.orderId || null;
    const existingIndex = orderId
      ? coupon.usageHistory.findIndex((h) => h.orderId === orderId)
      : -1;

    const record = {
      orderId,
      email: details.email ? details.email.toLowerCase().trim() : (details.customerEmail || null),
      customerName: details.customerName || details.name || 'Customer',
      usedAt: details.usedAt || new Date().toISOString(),
      discountAmount: details.discountAmount ?? null,
      finalAmount: details.finalAmount ?? 0,
      currency: details.currency || 'INR',
      licenseKey: details.licenseKey || null
    };

    if (existingIndex >= 0) {
      coupon.usageHistory[existingIndex] = { ...coupon.usageHistory[existingIndex], ...record };
    } else {
      coupon.usageHistory.unshift(record);
      coupon.usedCount = (coupon.usedCount || 0) + 1;
    }

    saveCoupons(coupons);
    return true;
  }
  return false;
}
