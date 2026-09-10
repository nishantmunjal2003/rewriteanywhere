// ZeptoMail Transactional Email Client (Zoho ZeptoMail API v1.1)

const ZEPTOMAIL_API_TOKEN = process.env.ZEPTOMAIL_API_TOKEN || process.env.ZEPTOMAIL_TOKEN || '';
const ZEPTOMAIL_FROM_EMAIL = process.env.ZEPTOMAIL_FROM_EMAIL || 'support@rewriteanywhere.nishantmunjal.com';
const ZEPTOMAIL_FROM_NAME = process.env.ZEPTOMAIL_FROM_NAME || 'AI Rewrite Anywhere';
const ZEPTOMAIL_ENDPOINT = process.env.ZEPTOMAIL_ENDPOINT || 'https://api.zeptomail.in/v1.1/email';

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

    const data = await res.json();
    if (!res.ok) {
      console.error('ZeptoMail API error:', data);
      return { success: false, error: data.message || 'Failed to dispatch email via ZeptoMail' };
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
      <div class="brand">⚡ AI Rewrite Anywhere</div>
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
      <div style="font-size: 13px; color: #94a3b8;">
        Portable ZIP format also available: <a href="https://rewriteanywhere.nishantmunjal.com/downloads/installer.zip" style="color: #38bdf8;">Download ZIP</a>
      </div>
    </div>

    <div class="steps">
      <h3 style="color: #ffffff; margin-top: 0; font-size: 16px;">Quick Activation Guide (30 Seconds):</h3>
      <ol>
        <li>Download and run <strong>AI-Rewrite-Anywhere-Setup.exe</strong> on Windows 10 or 11.</li>
        <li>Look for the glowing ⚡ icon in your Windows System Tray (near the clock).</li>
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
    <div class="brand">⚡ AI Rewrite Anywhere</div>
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
