import fs from 'fs';
import path from 'path';
import { readLicenses } from './license-manager';
import { readOrders } from './order-manager';

const RELEASES_FILE = path.join(process.cwd(), 'data', 'releases.json');

const DEFAULT_RELEASE = {
  id: 'rel_v1_0_0',
  version: 'v1.0.0-PROD',
  releaseDate: '2026-09-08T00:00:00.000Z',
  fileName: 'AI-Rewrite-Anywhere-Setup.exe',
  fileSize: '3.1 MB',
  fileSizeBytes: 3114366,
  downloadUrl: 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe',
  notes: 'Initial commercial release of AI Rewrite Anywhere for Windows 10 and 11.',
  isActive: true,
  broadcastCount: 0,
  lastBroadcastAt: null
};

export function readReleases() {
  try {
    if (!fs.existsSync(RELEASES_FILE)) {
      fs.writeFileSync(RELEASES_FILE, JSON.stringify([DEFAULT_RELEASE], null, 2), 'utf8');
      return [DEFAULT_RELEASE];
    }
    const raw = fs.readFileSync(RELEASES_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length > 0 ? data : [DEFAULT_RELEASE];
  } catch (error) {
    console.error('Error reading releases:', error);
    return [DEFAULT_RELEASE];
  }
}

export function saveReleases(releases) {
  try {
    const dir = path.dirname(RELEASES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RELEASES_FILE, JSON.stringify(releases, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving releases:', error);
    return false;
  }
}

export function getActiveRelease() {
  const releases = readReleases();
  const active = releases.find(r => r.isActive);
  return active || releases[0] || DEFAULT_RELEASE;
}

export function createRelease({
  version,
  notes = '',
  fileName = 'AI-Rewrite-Anywhere-Setup.exe',
  fileSize = '3.1 MB',
  fileSizeBytes = 3114366,
  downloadUrl = 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'
}) {
  const releases = readReleases();

  // Set all existing releases to isActive: false
  releases.forEach(r => {
    r.isActive = false;
  });

  const newRelease = {
    id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    version: version.trim(),
    releaseDate: new Date().toISOString(),
    fileName,
    fileSize,
    fileSizeBytes,
    downloadUrl,
    notes: notes.trim(),
    isActive: true,
    broadcastCount: 0,
    lastBroadcastAt: null
  };

  releases.unshift(newRelease);
  saveReleases(releases);
  return newRelease;
}

export function recordBroadcast(releaseId, recipientCount) {
  const releases = readReleases();
  const rel = releases.find(r => r.id === releaseId) || releases[0];
  if (rel) {
    rel.broadcastCount = (rel.broadcastCount || 0) + 1;
    rel.lastBroadcastAt = new Date().toISOString();
    rel.lastBroadcastRecipientCount = recipientCount;
    saveReleases(releases);
  }
  return rel;
}

/**
 * Extracts all unique licensed customer email addresses from licenses.json and orders.json
 */
export function getAllCustomerEmails() {
  const customersMap = new Map();

  // 1. From licenses.json
  try {
    const licenses = readLicenses();
    for (const lic of licenses) {
      const email = (lic.assignedEmail || lic.email || '').toLowerCase().trim();
      if (email && email.includes('@')) {
        if (!customersMap.has(email)) {
          customersMap.set(email, {
            email,
            name: lic.customerName || 'Valued Customer',
            licenseKey: lic.licenseKey || '',
            source: 'license'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error reading licenses for customer emails:', err);
  }

  // 2. From orders.json
  try {
    const orders = readOrders();
    for (const orderId in orders) {
      const order = orders[orderId];
      const email = (order.customerEmail || '').toLowerCase().trim();
      if (email && email.includes('@')) {
        if (!customersMap.has(email)) {
          customersMap.set(email, {
            email,
            name: order.customerName || 'Valued Customer',
            licenseKey: order.licenseKey || '',
            source: 'order'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error reading orders for customer emails:', err);
  }

  return Array.from(customersMap.values());
}
