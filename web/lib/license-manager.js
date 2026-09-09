import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous charset (no 0, O, 1, I)

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
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading licenses.json:', err);
  }
  return [];
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
