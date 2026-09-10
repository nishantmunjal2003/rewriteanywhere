import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous charset (no 0, O, 1, I)

export const SEED_LICENSES = [
  {
    id: 'lic_1789031829128_z6zdx',
    licenseKey: 'ARW-MZD9-36TE-KUX6-MP44',
    tier: 'INR_1600',
    price: '₹1,600 INR',
    currency: 'INR',
    maxDevices: 1,
    activeMachineId: null,
    status: 'unactivated',
    createdAt: '2026-09-10T09:24:00.000Z',
    activatedAt: null,
    assignedEmail: 'nishant@gkv.ac.in',
    email: 'nishant@gkv.ac.in',
    customerName: 'Dr. Nishant Munjal',
    orderId: 'ARW_1789031829128_Z6ZDX',
    paymentGateway: 'CASHFREE',
    notes: 'Online purchase via Cashfree',
    releaseHistory: []
  },
  {
    licenseKey: 'ARW-ZQTR-9FBP-TVKL-TX9P',
    tier: 'USD_19',
    price: '$19 USD',
    maxDevices: 1,
    activeMachineId: 'HWID-29E2-D896-C007-646F',
    status: 'active',
    createdAt: '2026-09-07T15:39:21.974Z',
    activatedAt: '2026-09-10T06:20:20.693Z',
    assignedEmail: 'nishant@gkv.ac.in',
    customerName: 'Dr. Nishant Munjal',
    notes: null,
    releaseHistory: [
      {
        releasedHwid: 'HWID-29E2-D896-C007-646F',
        timestamp: '2026-09-07T15:49:28.172Z',
        reason: 'Admin HWID reset'
      }
    ],
    releasedAt: '2026-09-07T15:49:28.172Z'
  },
  {
    licenseKey: 'ARW-WGJ2-EX5M-JETJ-W6BL',
    tier: 'USD_19',
    price: '$19 USD',
    maxDevices: 1,
    activeMachineId: null,
    status: 'revoked',
    createdAt: '2026-09-07T14:57:40.758Z',
    activatedAt: '2026-09-07T15:49:35.006Z',
    assignedEmail: null,
    releasedAt: '2026-09-07T15:49:25.783Z',
    releaseHistory: [
      {
        releasedHwid: 'HWID-TEST-0001-0002',
        timestamp: '2026-09-07T15:45:14.025Z',
        reason: 'Admin HWID reset'
      },
      {
        releasedHwid: 'HWID-29E2-D896-C007-646F',
        timestamp: '2026-09-07T15:49:25.783Z',
        reason: 'Admin HWID reset'
      }
    ],
    revokedAt: '2026-09-07T16:05:00.194Z',
    revocationReason: '14-Day Full Refund Processed'
  },
  {
    licenseKey: 'ARW-4578-ZWSH-SW7C-G7WW',
    tier: 'USD_19',
    price: '$19 USD',
    maxDevices: 1,
    activeMachineId: null,
    status: 'unactivated',
    createdAt: '2026-09-07T14:57:40.760Z',
    activatedAt: null,
    assignedEmail: null
  },
  {
    licenseKey: 'ARW-FPES-S94C-QKJP-TQ69',
    tier: 'USD_19',
    price: '$19 USD',
    maxDevices: 1,
    activeMachineId: null,
    status: 'unactivated',
    createdAt: '2026-09-07T14:57:40.760Z',
    activatedAt: null,
    assignedEmail: null
  },
  {
    licenseKey: 'ARW-WWP4-ZHQA-AQR7-D8XJ',
    tier: 'INR_2000',
    price: '₹2,000 INR',
    maxDevices: 1,
    activeMachineId: null,
    status: 'unactivated',
    createdAt: '2026-09-07T15:26:54.141Z',
    activatedAt: null,
    assignedEmail: 'nishant@example.com'
  }
];

export function getRandomSegment(len = 4) {
  let result = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

export function generateLicenseKey() {
  const p1 = getRandomSegment(4);
  const p2 = getRandomSegment(4);
  const p3 = getRandomSegment(4);
  const p4 = getRandomSegment(4);
  return `ARW-${p1}-${p2}-${p3}-${p4}`;
}

export function getDbPath() {
  return path.join(process.cwd(), 'data', 'licenses.json');
}

export function readLicenses() {
  let diskLicenses = [];
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      diskLicenses = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading licenses.json:', err);
  }

  // Map disk licenses by uppercase licenseKey
  const map = new Map();
  for (const lic of diskLicenses) {
    if (lic && lic.licenseKey) {
      map.set(lic.licenseKey.toUpperCase(), lic);
    }
  }

  // Merge seed licenses if missing from disk
  let changed = false;
  for (const seed of SEED_LICENSES) {
    const key = seed.licenseKey.toUpperCase();
    if (!map.has(key)) {
      map.set(key, { ...seed });
      changed = true;
    }
  }

  const merged = Array.from(map.values());

  if (changed) {
    saveLicenses(merged);
  }

  return merged;
}

export function saveLicenses(licenses) {
  try {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(licenses, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving licenses.json:', err);
    return false;
  }
}
