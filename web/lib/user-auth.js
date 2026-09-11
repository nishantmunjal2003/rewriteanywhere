import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const USER_SESSION_SECRET =
  process.env.USER_SESSION_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.LICENSE_HMAC_SECRET ||
  'arw-user-auth-secret-key-2026';

const USER_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getOtpsFilePath() {
  return path.join(process.cwd(), 'data', 'otps.json');
}

function readOtps() {
  try {
    const filePath = getOtpsFilePath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading otps.json:', err);
  }
  return {};
}

function saveOtps(otps) {
  try {
    const filePath = getOtpsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(otps, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving otps.json:', err);
    return false;
  }
}

/**
 * Creates a signed JWT-like session token for a verified customer email
 */
export function createCustomerSessionToken(email) {
  const cleanEmail = email.toLowerCase().trim();
  const payload = {
    email: cleanEmail,
    role: 'customer',
    issuedAt: Date.now(),
    expiresAt: Date.now() + USER_SESSION_MAX_AGE_SECONDS * 1000
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', USER_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a customer session token
 */
export function verifyCustomerSessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', USER_SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) return null;
    if (!payload.email || typeof payload.email !== 'string') return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates a 6-digit numeric OTP for an email using CSPRNG and saves SHA-256 hash
 */
export function generateAndSaveOtp(email) {
  const cleanEmail = email.toLowerCase().trim();
  const otps = readOtps();
  const existing = otps[cleanEmail];

  // Cooldown protection: limit 1 request per 60 seconds per email
  if (existing && existing.createdAt && (Date.now() - existing.createdAt < 60 * 1000)) {
    const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - existing.createdAt)) / 1000);
    return {
      success: false,
      cooldown: true,
      message: `Please wait ${waitSeconds} seconds before requesting another verification code.`
    };
  }

  // Cryptographically secure 6-digit number
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');

  otps[cleanEmail] = {
    codeHash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    createdAt: Date.now()
  };

  saveOtps(otps);
  return { success: true, code: otpCode };
}

/**
 * Verifies and consumes an OTP code for an email by comparing SHA-256 hash
 */
export function verifyAndConsumeOtp(email, enteredCode) {
  if (!email || !enteredCode) {
    return { valid: false, message: 'Email and OTP code are required.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = enteredCode.toString().trim();
  const enteredHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

  const otps = readOtps();
  const record = otps[cleanEmail];

  if (!record) {
    return { valid: false, message: 'No verification code was requested for this email, or it has expired.' };
  }

  if (Date.now() > record.expiresAt) {
    delete otps[cleanEmail];
    saveOtps(otps);
    return { valid: false, message: 'Verification code has expired. Please request a new code.' };
  }

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    delete otps[cleanEmail];
    saveOtps(otps);
    return { valid: false, message: 'Too many incorrect attempts. Please request a new code.' };
  }

  // Compare hash (or legacy plaintext if present)
  const isMatch = record.codeHash
    ? record.codeHash === enteredHash
    : record.code === cleanCode;

  if (!isMatch) {
    saveOtps(otps);
    return { valid: false, message: 'Invalid verification code. Please check your email.' };
  }

  // OTP is valid - consume it immediately
  delete otps[cleanEmail];
  saveOtps(otps);

  return { valid: true, email: cleanEmail };
}
