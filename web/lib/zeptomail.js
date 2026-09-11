// ZeptoMail Transactional Email Client (Zoho ZeptoMail API v1.1)

const ZEPTOMAIL_API_TOKEN =
  process.env.ZEPTOMAIL_API_KEY ||
  process.env.ZEPTOMAIL_API_TOKEN ||
  process.env.ZEPTOMAIL_TOKEN ||
  '';

const ZEPTOMAIL_FROM_EMAIL =
  process.env.ZEPTOMAIL_FROM_ADDRESS ||
  process.env.ZEPTOMAIL_FROM_EMAIL ||
  'noreply@nmril.com';

const ZEPTOMAIL_FROM_NAME =
  process.env.ZEPTOMAIL_FROM_NAME ||
  'Rewrite Anywhere';

const ZEPTOMAIL_ENDPOINT =
  process.env.ZEPTOMAIL_URL ||
  process.env.ZEPTOMAIL_ENDPOINT ||
  'https://api.zeptomail.com/v1.1/email';

export function getZeptoMailConfig() {
  return {
    isConfigured: Boolean(ZEPTOMAIL_API_TOKEN),
    fromEmail: ZEPTOMAIL_FROM_EMAIL,
    fromName: ZEPTOMAIL_FROM_NAME,
    endpoint: ZEPTOMAIL_ENDPOINT
  };
}

/**
 * Sends a transactional email using ZeptoMail REST API
 */
export async function sendEmail({ toEmail, toName = '', subject, htmlBody, textBody = '' }) {
  if (!ZEPTOMAIL_API_TOKEN) {
    console.log(`[ZeptoMail DEV/MOCK] To: ${toEmail} | Subject: ${subject}`);
    console.log(`[ZeptoMail DEV/MOCK Content]:\n${textBody || htmlBody.replace(/<[^>]*>?/gm, '')}`);
    return { success: true, isMock: true, message: 'ZeptoMail token not configured; logged to console.' };
  }

  const payload = {
    from: {
      address: ZEPTOMAIL_FROM_EMAIL,
      name: ZEPTOMAIL_FROM_NAME
    },
    to: [
      {
        email_address: {
          address: toEmail.toLowerCase().trim(),
          name: toName || toEmail
        }
      }
    ],
    subject,
    htmlbody: htmlBody
  };

  try {
    const authHeader = ZEPTOMAIL_API_TOKEN.startsWith('Zoho-enczapikey')
      ? ZEPTOMAIL_API_TOKEN
      : `Zoho-enczapikey ${ZEPTOMAIL_API_TOKEN}`;

    const res = await fetch(ZEPTOMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    let data = await res.json();
    if (!res.ok) {
      console.error('ZeptoMail API error:', JSON.stringify(data));
      const errorMsg = data.error?.details?.[0]?.message || data.message || 'Failed to dispatch email via ZeptoMail';
      return { success: false, error: errorMsg, details: data.error?.details };
    }

    return { success: true, isMock: false, data };
  } catch (err) {
    console.error('ZeptoMail network exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches the License Key Delivery email after purchase
 */
export async function sendLicenseEmail({ toEmail, customerName, licenseKey, orderId, amount, currency }) {
  const subject = `Your AI Rewrite Anywhere Lifetime Commercial License [${licenseKey}]`;
  const name = customerName || 'Valued Customer';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; }
    .header { text-align: center; margin-bottom: 30px; }
    .brand { font-size: 22px; font-weight: bold; color: #6366f1; }
    .key-box { background: #1e1b4b; border: 2px dashed #818cf8; border-radius: 12px; padding: 20px; text-align: center; margin: 26px 0; }
    .key { font-family: monospace; font-size: 24px; font-weight: 800; color: #facc15; letter-spacing: 2px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .steps { background: #162035; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .steps ol { margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8; }
    .footer { text-align: center; margin-top: 32px; font-size: 13px; color: #64748b; border-top: 1px solid #1f2937; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="text-align: center; margin-bottom: 14px;">
        <img src="https://rewriteanywhere.nishantmunjal.com/app_icon.png" width="56" height="56" alt="AI Rewrite Anywhere" style="border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); vertical-align: middle;" />
      </div>
      <div class="brand">AI Rewrite Anywhere</div>
      <h2 style="color: #ffffff; margin-top: 10px;">Thank you for your purchase, ${name}!</h2>
      <p style="color: #94a3b8; font-size: 15px;">Your lifetime commercial license key is ready for immediate activation.</p>
    </div>

    <div class="key-box">
      <div style="font-size: 13px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px;">Your Lifetime Commercial License Key</div>
      <div class="key">${licenseKey}</div>
      <div style="font-size: 12px; color: #a5b4fc; margin-top: 8px;">Valid for 1 Active Windows PC • Free Updates Included</div>
    </div>

    <div style="text-align: center;">
      <a href="https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe" class="btn">
        ⬇️ Download Windows Installer (.exe)
      </a>
      <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">
        Compatible with Windows 10 & 11 (64-bit)
      </div>
    </div>

    <div class="steps">
      <h3 style="color: #ffffff; margin-top: 0; font-size: 16px;">Quick Activation Guide (30 Seconds):</h3>
      <ol>
        <li>Download and run <strong>AI-Rewrite-Anywhere-Setup.exe</strong> on Windows 10 or 11.</li>
        <li>Look for the <strong>AI Rewrite Anywhere</strong> cosmic quill icon in your Windows System Tray (near the clock).</li>
        <li>Right-click the tray icon and select <strong>Settings → License</strong>.</li>
        <li>Paste your license key: <code style="color: #facc15;">${licenseKey}</code> and click <strong>Activate License</strong>.</li>
        <li>Press <strong>Ctrl+Shift+R</strong> in any Windows application to rewrite in place!</li>
      </ol>
    </div>

    <div style="background: #0f172a; padding: 16px; border-radius: 8px; font-size: 13px; color: #94a3b8;">
      <strong>Order Reference:</strong> ${orderId}<br/>
      <strong>Amount Paid:</strong> ${currency} ${amount}<br/>
      <strong>Customer Dashboard:</strong> You can access your keys and software updates anytime at <a href="https://rewriteanywhere.nishantmunjal.com/dashboard" style="color: #38bdf8;">rewriteanywhere.nishantmunjal.com/dashboard</a>.
    </div>

    <div class="footer">
      AI Rewrite Anywhere • 14-Day 100% Money-Back Guarantee<br/>
      Need support? Contact <a href="mailto:support@rewriteanywhere.com" style="color: #818cf8;">support@rewriteanywhere.com</a>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    toEmail,
    toName: customerName,
    subject,
    htmlBody
  });
}

/**
 * Dispatches an instant notification email to Admin(s) whenever a new purchase or license activation occurs
 */
export async function sendAdminPurchaseAlert({
  orderId,
  customerEmail,
  customerName = 'Customer',
  customerPhone = 'N/A',
  licenseKey,
  amount,
  currency = 'INR',
  couponCode = null,
  isFree = false,
  paymentGateway = 'CASHFREE'
}) {
  const adminEmailsEnv = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || 'nishantmunjal2003@gmail.com';
  const adminEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    adminEmails.push('nishantmunjal2003@gmail.com');
  }

  const isFreeOrder = isFree || amount === 0;
  const priceDisplay = isFreeOrder
    ? (couponCode ? `100% OFF Free (Coupon: ${couponCode})` : 'Free License')
    : `${currency === 'USD' ? '$' : '₹'}${amount} ${currency}`;

  const subject = isFreeOrder
    ? `🎟️ [Free License Claimed] ${customerName} (${customerEmail}) - Coupon ${couponCode || 'PROMO'}`
    : `💰 [New Purchase Alert] ${currency === 'USD' ? '$' : '₹'}${amount} from ${customerName} (${customerEmail})`;

  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; }
    .header { text-align: center; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-paid { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }
    .badge-coupon { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid #a855f7; }
    .key-box { background: #1e1b4b; border: 2px dashed #818cf8; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .key { font-family: monospace; font-size: 20px; font-weight: 800; color: #facc15; letter-spacing: 2px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #162035; border-radius: 10px; overflow: hidden; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid #1f2937; font-size: 14px; color: #cbd5e1; }
    .data-table td.label { font-weight: 600; color: #94a3b8; width: 35%; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .footer { text-align: center; margin-top: 28px; font-size: 12px; color: #64748b; border-top: 1px solid #1f2937; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="text-align: center; margin-bottom: 14px;">
        <img src="https://rewriteanywhere.nishantmunjal.com/app_icon.png" width="52" height="52" alt="AI Rewrite Anywhere" style="border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); vertical-align: middle;" />
      </div>
      <div style="margin-bottom: 12px;">
        <span class="badge ${isFreeOrder ? 'badge-coupon' : 'badge-paid'}">
          ${isFreeOrder ? '🎟️ Free Coupon License' : '💰 New Paid Purchase'}
        </span>
      </div>
      <h2 style="color: #ffffff; margin: 0 0 6px 0;">New Order Notification</h2>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">A new license has been minted and delivered to customer.</p>
    </div>

    <div class="key-box">
      <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px;">Minted Commercial License Key</div>
      <div class="key">${licenseKey}</div>
    </div>

    <table class="data-table">
      <tr>
        <td class="label">Customer Name</td>
        <td><strong>${customerName}</strong></td>
      </tr>
      <tr>
        <td class="label">Email Address</td>
        <td><a href="mailto:${customerEmail}" style="color: #38bdf8;">${customerEmail}</a></td>
      </tr>
      <tr>
        <td class="label">Phone</td>
        <td>${customerPhone || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Amount / Tier</td>
        <td><strong>${priceDisplay}</strong></td>
      </tr>
      ${couponCode ? `<tr><td class="label">Coupon Code</td><td><strong style="color: #c084fc;">${couponCode}</strong></td></tr>` : ''}
      <tr>
        <td class="label">Order Reference</td>
        <td><code style="font-family: monospace; color: #a5b4fc;">${orderId}</code></td>
      </tr>
      <tr>
        <td class="label">Payment Mode</td>
        <td>${paymentGateway}</td>
      </tr>
      <tr>
        <td class="label">Order Time</td>
        <td>${dateStr} (IST)</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://rewriteanywhere.nishantmunjal.com/admin" class="btn">
        🔐 Open Admin Portal
      </a>
    </div>

    <div class="footer">
      AI Rewrite Anywhere Admin Notification System • <a href="https://rewriteanywhere.nishantmunjal.com" style="color: #818cf8;">rewriteanywhere.nishantmunjal.com</a>
    </div>
  </div>
</body>
</html>
  `;

  const results = [];
  for (const adminEmail of adminEmails) {
    try {
      const res = await sendEmail({
        toEmail: adminEmail,
        toName: 'Admin',
        subject,
        htmlBody
      });
      results.push(res);
    } catch (err) {
      console.error(`Failed to send admin purchase alert to ${adminEmail}:`, err);
    }
  }

  return { success: true, count: results.length };
}

/**
 * Dispatches the 6-digit OTP code for Customer Dashboard login
 */
export async function sendOtpEmail({ toEmail, otpCode }) {
  const subject = `Your AI Rewrite Anywhere Login Code: ${otpCode}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; text-align: center; }
    .brand { font-size: 20px; font-weight: bold; color: #6366f1; margin-bottom: 20px; }
    .otp { font-family: monospace; font-size: 36px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; background: #1e293b; padding: 16px; border-radius: 10px; margin: 24px 0; border: 1px solid #334155; }
    .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; margin-bottom: 14px;">
      <img src="https://rewriteanywhere.nishantmunjal.com/app_icon.png" width="52" height="52" alt="AI Rewrite Anywhere" style="border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); vertical-align: middle;" />
    </div>
    <div class="brand">AI Rewrite Anywhere</div>
    <h2 style="color: #ffffff; margin-top: 0;">Your Verification Code</h2>
    <p style="color: #94a3b8; font-size: 15px;">Use this 6-digit one-time code to log into your customer dashboard and access your purchased license keys and software downloads:</p>

    <div class="otp">${otpCode}</div>

    <p style="color: #f59e0b; font-size: 13px;">This code is valid for 10 minutes. Do not share this code with anyone.</p>

    <div class="footer">
      If you did not request this code, you can safely ignore this email.<br/>
      AI Rewrite Anywhere • <a href="https://rewriteanywhere.nishantmunjal.com" style="color: #818cf8;">rewriteanywhere.nishantmunjal.com</a>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    toEmail,
    subject,
    htmlBody
  });
}

/**
 * Dispatches New Software Version Release email to licensed customers
 */
export async function sendReleaseUpdateEmail({
  toEmail,
  customerName = 'Valued Customer',
  version,
  notes = '',
  downloadUrl = 'https://rewriteanywhere.nishantmunjal.com/downloads/AI-Rewrite-Anywhere-Setup.exe'
}) {
  const subject = `🚀 New Update Released: AI Rewrite Anywhere ${version}`;

  const formattedNotes = notes
    ? notes
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => `<li>${line.startsWith('-') ? line.substring(1).trim() : line}</li>`)
        .join('')
    : '<li>Performance improvements, stability enhancements, and bug fixes.</li>';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; }
    .header { text-align: center; margin-bottom: 26px; }
    .brand { font-size: 20px; font-weight: bold; color: #6366f1; }
    .version-badge { display: inline-block; background: rgba(99, 102, 241, 0.15); border: 1px solid #6366f1; color: #a5b4fc; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin: 12px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #06b6d4); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .changelog-box { background: #162035; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left; }
    .changelog-box ul { margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.8; }
    .instructions { background: #0f172a; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #94a3b8; line-height: 1.6; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #1f2937; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="text-align: center; margin-bottom: 14px;">
        <img src="https://rewriteanywhere.nishantmunjal.com/app_icon.png" width="56" height="56" alt="AI Rewrite Anywhere" style="border-radius: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); vertical-align: middle;" />
      </div>
      <div class="brand">AI Rewrite Anywhere</div>
      <div class="version-badge">✨ NEW RELEASE • ${version}</div>
      <h2 style="color: #ffffff; margin-top: 8px;">A brand new update is available!</h2>
      <p style="color: #94a3b8; font-size: 15px; margin-top: 4px;">
        Hello ${customerName}, as a valued lifetime license holder, your free update is ready for immediate download.
      </p>
    </div>

    <div class="changelog-box">
      <h3 style="color: #ffffff; margin-top: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">What's New in ${version}:</h3>
      <ul>
        ${formattedNotes}
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${downloadUrl}" class="btn">
        ⬇️ Download Installer (.exe) - ${version}
      </a>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
        Standalone Native Windows Installer • Windows 10 & 11 (64-bit)
      </div>
    </div>

    <div class="instructions">
      <strong style="color: #f8fafc;">How to Upgrade:</strong><br/>
      Simply download and run the installer. It will automatically upgrade your existing installation in place. <strong>Your license key and settings will be preserved automatically.</strong>
    </div>

    <div class="footer">
      You are receiving this update announcement because you purchased an AI Rewrite Anywhere commercial license.<br/>
      Dashboard: <a href="https://rewriteanywhere.nishantmunjal.com/dashboard" style="color: #38bdf8;">rewriteanywhere.nishantmunjal.com/dashboard</a> • Support: <a href="mailto:support@rewriteanywhere.com" style="color: #818cf8;">support@rewriteanywhere.com</a>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    toEmail,
    toName: customerName,
    subject,
    htmlBody
  });
}
