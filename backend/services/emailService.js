/**
 * Email Alert Service
 * Sends security notifications to admin
 */

import nodemailer from "nodemailer";

// Create transporter based on environment
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Production: Use actual SMTP credentials
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Gmail configuration
  else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  // Development: Log emails to console
  else {
    transporter = {
      sendMail: async (options) => {
        console.log("📧 [DEV EMAIL] To:", options.to);
        console.log("📧 [DEV EMAIL] Subject:", options.subject);
        console.log(
          "📧 [DEV EMAIL] Body:",
          options.text || options.html?.substring(0, 200)
        );
        return { messageId: "dev-" + Date.now() };
      },
    };
    console.log("⚠️ Email service running in development mode (console only)");
  }

  return transporter;
}

/**
 * Send login alert email to admin
 */
export async function sendLoginAlert(admin, loginInfo) {
  const { ip, location, deviceInfo, timestamp } = loginInfo;

  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .info-label { font-weight: 600; width: 120px; color: #64748b; }
    .info-value { color: #1e293b; }
    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
    .warning { color: #dc2626; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🔐 Security Alert</h1>
      <p style="margin:10px 0 0;">PG Management System</p>
    </div>
    <div class="content">
      <h2 style="color:#1e293b;">New Login Detected</h2>
      <p>Hello <strong>${admin.name || "Admin"}</strong>,</p>
      <p>A new login to your PG Management account was detected:</p>

      <div style="margin: 25px 0;">
        <div class="info-row">
          <span class="info-label">📅 Time:</span>
          <span class="info-value">${new Date(timestamp).toLocaleString(
            "en-IN",
            { timeZone: "Asia/Kolkata" }
          )} IST</span>
        </div>
        <div class="info-row">
          <span class="info-label">🌐 IP Address:</span>
          <span class="info-value">${ip}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📍 Location:</span>
          <span class="info-value">${location?.city || "Unknown"}, ${
    location?.country || "Unknown"
  }</span>
        </div>
        <div class="info-row">
          <span class="info-label">💻 Device:</span>
          <span class="info-value">${
            deviceInfo?.browser || "Unknown Browser"
          } on ${deviceInfo?.os || "Unknown OS"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">📱 Type:</span>
          <span class="info-value">${
            deviceInfo?.isMobile ? "Mobile Device" : "Desktop/Laptop"
          }</span>
        </div>
      </div>

      <div class="alert-box">
        <p style="margin:0;"><strong>⚠️ Was this you?</strong></p>
        <p style="margin:10px 0 0;">If you did not perform this login, your account may be compromised. Please:</p>
        <ol style="margin: 10px 0;">
          <li>Block the suspicious IP address immediately</li>
          <li>Review all recent account activity</li>
          <li>Contact support if needed</li>
        </ol>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated security notification from PG Management System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textVersion = `
🔐 PG Management - Security Alert

Hello ${admin.name || "Admin"},

A new login to your account was detected:

• Time: ${new Date(timestamp).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  })} IST
• IP Address: ${ip}
• Location: ${location?.city || "Unknown"}, ${location?.country || "Unknown"}
• Device: ${deviceInfo?.browser || "Unknown"} on ${deviceInfo?.os || "Unknown"}

If this wasn't you, please block this IP address immediately.
  `;

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from:
        process.env.EMAIL_FROM ||
        '"PG Management" <security@pg-management.com>',
      to: admin.email || process.env.ADMIN_EMAIL,
      subject: `🔐 New Login Alert - ${location?.city || ip}`,
      text: textVersion,
      html: emailTemplate,
    });

    console.log(`✅ Login alert sent to ${admin.email || "admin"}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send login alert:", error.message);
    return false;
  }
}

/**
 * Send suspicious activity alert
 */
export async function sendSuspiciousActivityAlert(admin, activity) {
  const { ip, type, details, timestamp } = activity;

  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fef2f2; padding: 30px; border: 1px solid #fecaca; }
    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">🚨 Suspicious Activity</h1>
    </div>
    <div class="content">
      <h2>Security Threat Detected</h2>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>IP Address:</strong> ${ip}</p>
      <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <p><strong>Details:</strong> ${details}</p>
      <p style="color:#dc2626;font-weight:bold;">This IP has been automatically blocked.</p>
    </div>
    <div class="footer">
      <p>PG Management Security System</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from:
        process.env.EMAIL_FROM || '"PG Security" <security@pg-management.com>',
      to: admin.email || process.env.ADMIN_EMAIL,
      subject: `🚨 ALERT: Suspicious Activity Detected - ${type}`,
      html: emailTemplate,
    });

    return true;
  } catch (error) {
    console.error("Failed to send suspicious activity alert:", error.message);
    return false;
  }
}

/**
 * Send IP blocked notification
 */
export async function sendIPBlockedAlert(adminEmail, blockInfo) {
  const { ip, reason, blockedAt } = blockInfo;

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from:
        process.env.EMAIL_FROM || '"PG Security" <security@pg-management.com>',
      to: adminEmail || process.env.ADMIN_EMAIL,
      subject: `🛡️ IP Address Blocked - ${ip}`,
      html: `
        <h2>IP Address Blocked</h2>
        <p><strong>IP:</strong> ${ip}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Blocked At:</strong> ${new Date(
          blockedAt
        ).toLocaleString()}</p>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send IP blocked alert:", error.message);
    return false;
  }
}

export default {
  sendLoginAlert,
  sendSuspiciousActivityAlert,
  sendIPBlockedAlert,
};
