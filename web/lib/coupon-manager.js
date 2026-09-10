import fs from 'fs';
import path from 'path';

function getCouponsPath() {
  return path.join(process.cwd(), 'data', 'coupons.json');
}

export function readCoupons() {
  try {
    const filePath = getCouponsPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading coupons.json:', err);
  }
  return [];
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
 * Increments usage count of a coupon after successful purchase
 */
export function recordCouponUsage(code) {
  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();
  const coupons = readCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);
  if (coupon) {
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    saveCoupons(coupons);
    return true;
  }
  return false;
}
