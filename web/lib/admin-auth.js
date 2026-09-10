import crypto from 'crypto';

export const AUTHORIZED_ADMIN_EMAIL = 'nishantmunjal2003@gmail.com';
export const EXPECTED_GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '698709002321-lhmhulia304qiqqj55lhehk5tn70k753.apps.googleusercontent.com';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.LICENSE_HMAC_SECRET || 'arw-admin-secure-session-key-2026';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Creates a cryptographically signed session token for the authorized admin
 */
export function createSessionToken(user) {
  const payload = {
    email: user.email.toLowerCase(),
    name: user.name || 'Admin',
    picture: user.picture || '',
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    if (payload.email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Validates Google ID token by verifying with Google's tokeninfo API
 */
export async function verifyGoogleIdToken(idToken) {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      method: 'GET'
    });

    if (!res.ok) {
      return { valid: false, error: 'Failed to verify token with Google' };
    }

    const data = await res.json();
    // data contains email, email_verified, name, picture, sub, aud, etc.
    const isVerified = data.email_verified === 'true' || data.email_verified === true;
    if (!isVerified) {
      return { valid: false, error: 'Google email address is not verified.' };
    }

    const email = (data.email || '').toLowerCase().trim();
    if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return {
        valid: false,
        error: `Access Denied: ${email} is not authorized. Only ${AUTHORIZED_ADMIN_EMAIL} can access this administration portal.`
      };
    }

    return {
      valid: true,
      user: {
        email,
        name: data.name || data.given_name || 'Admin',
        picture: data.picture || ''
      }
    };
  } catch (err) {
    console.error('Error verifying Google ID token:', err);
    return { valid: false, error: 'Network error verifying Google ID token.' };
  }
}

/**
 * Extracts and verifies admin session from a Next.js Request (cookie or header)
 */
export function getAdminSessionFromRequest(request) {
  // 1. Check HttpOnly cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter(([k]) => Boolean(k))
  );

  const cookieToken = cookies['arw_admin_session'];
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Check Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifySessionToken(token);
    if (verified) return verified;
  }

  // 3. Check legacy custom header for backward-compatible fallback
  const customHeader = request.headers.get('x-admin-session');
  if (customHeader) {
    const verified = verifySessionToken(customHeader);
    if (verified) return verified;
  }

  return null;
}
