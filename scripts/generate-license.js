#!/usr/bin/env node

/**
 * AI Rewrite Anywhere - License Key Generator
 *
 * Usage:
 *   node scripts/generate-license.js
 *   node scripts/generate-license.js --count 5
 *   node scripts/generate-license.js --tier "inr" --email "customer@example.com"
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous charset (no 0, O, 1, I)

function getRandomSegment(len = 4) {
    let result = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
        result += CHARS[bytes[i] % CHARS.length];
    }
    return result;
}

function generateLicenseKey() {
    const p1 = getRandomSegment(4);
    const p2 = getRandomSegment(4);
    const p3 = getRandomSegment(4);
    const p4 = getRandomSegment(4);
    return `ARW-${p1}-${p2}-${p3}-${p4}`;
}

// Parse args
const args = process.argv.slice(2);
let count = 1;
let tier = 'usd'; // 'usd' ($19) or 'inr' (₹2000)
let email = '';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
        count = parseInt(args[i + 1], 10) || 1;
        i++;
    } else if (args[i] === '--tier' && args[i + 1]) {
        tier = args[i + 1].toLowerCase();
        i++;
    } else if (args[i] === '--email' && args[i + 1]) {
        email = args[i + 1];
        i++;
    }
}

const licenses = [];
const priceLabel = tier === 'inr' ? '₹2,000 INR' : '$19 USD';

console.log('===========================================================');
console.log('  AI Rewrite Anywhere - Commercial License Key Generator');
console.log(`  Environment: Windows 10/11 x64`);
console.log(`  Policy: 1 Active Device / Hardware-Bound License`);
console.log(`  Guarantee: 14-Day Money-Back Guarantee`);
console.log(`  Price Tier: ${priceLabel}`);
console.log('===========================================================\n');

for (let i = 0; i < count; i++) {
    const key = generateLicenseKey();
    const licenseRecord = {
        licenseKey: key,
        tier: tier === 'inr' ? 'INR_2000' : 'USD_19',
        price: priceLabel,
        maxDevices: 1,
        activeMachineId: null,
        status: 'unactivated',
        createdAt: new Date().toISOString(),
        activatedAt: null,
        assignedEmail: email || null
    };
    licenses.push(licenseRecord);
    console.log(`[${i + 1}] License Key: \x1b[32m${key}\x1b[0m`);
}

// Optionally save to web/data/licenses.json if folder exists
const dataDir = path.join(__dirname, '..', 'web', 'data');
const dbFile = path.join(dataDir, 'licenses.json');

try {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    let existing = [];
    if (fs.existsSync(dbFile)) {
        try {
            existing = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
        } catch {
            existing = [];
        }
    }
    const combined = [...existing, ...licenses];
    fs.writeFileSync(dbFile, JSON.stringify(combined, null, 2), 'utf8');
    console.log(`\nSuccessfully appended ${licenses.length} key(s) to ${dbFile}`);
} catch (err) {
    console.warn(`Could not auto-write to web/data/licenses.json: ${err.message}`);
}
