const nodemailer = require("nodemailer");

/**
 * Email Notification Integration (Nodemailer)
 * Module 3 - External API Integration (Assigned to: Iffat Islam Aria)
 *
 * Provides automated email notifications for:
 * 1. Emergency request confirmations (citizen submits a report)
 * 2. Volunteer task assignments
 * 3. Request status updates
 * 4. Password recovery (forgot/reset password flow)
 *
 * Includes dual-mode operation, matching the pattern used by smsService.js:
 * - Live Mode: Sends real email via Gmail SMTP (free — no paid API, no card required)
 *   when NODEMAILER_EMAIL + NODEMAILER_APP_PASSWORD are set in .env
 * - Simulation Mode: Formats, validates, and logs email "delivery" when running
 *   without those credentials, so the rest of the team can run the app and see
 *   this feature work without needing a real Gmail account configured.
 */

let transporter = null;

// Initialize the Nodemailer transporter if credentials are provided
function getTransporter() {
  if (transporter) return transporter;
  const emailUser = process.env.NODEMAILER_EMAIL;
  const emailPass = process.env.NODEMAILER_APP_PASSWORD;

  if (emailUser && emailPass && !emailUser.includes("replace_with")) {
    try {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass },
      });
      return transporter;
    } catch (err) {
      console.warn("[Email Service] Failed to initialize Nodemailer transporter:", err.message);
      return null;
    }
  }
  return null;
}

// In-memory transmission log buffer (persisted per server session for admin monitoring)
const emailLogs = [];
const MAX_LOG_HISTORY = 100;

function recordLog(entry) {
  emailLogs.unshift({
    id: "email_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (emailLogs.length > MAX_LOG_HISTORY) {
    emailLogs.pop();
  }
}

// Shared branded wrapper so every email type looks consistent
function buildEmailTemplate({ heading, bodyHtml }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #1f2a44; color: #ffffff; padding: 16px 20px;">
        <strong style="font-size: 16px;">🚨 Rapid Relief</strong>
      </div>
      <div style="padding: 20px; color: #18181b;">
        <h2 style="margin-top: 0; font-size: 18px;">${heading}</h2>
        ${bodyHtml}
      </div>
      <div style="padding: 12px 20px; background: #f4f4f5; color: #6b7280; font-size: 11px;">
        Disaster Relief Coordination Platform — CSE471 Group 03
      </div>
    </div>
  `;
}

/**
 * Send an email to a recipient.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML email body
 * @param {string} [options.type='general'] - Category, for logging
 * @param {Object} [options.metadata] - Extra metadata (requestId, etc.)
 */
async function sendEmail({ to, subject, html, type = "general", metadata = {} }) {
  if (!to) {
    console.warn("[Email Service] Skipped sending email: No recipient address provided.");
    return { success: false, reason: "No recipient email provided" };
  }

  const fromAddress = process.env.NODEMAILER_EMAIL || "no-reply@rapidrelief.dev";
  const mailer = getTransporter();

  if (mailer) {
    try {
      const info = await mailer.sendMail({
        from: `"Rapid Relief" <${fromAddress}>`,
        to,
        subject,
        html,
      });

      recordLog({ to, from: fromAddress, subject, type, status: "delivered", messageId: info.messageId, mode: "live_smtp", metadata });
      console.log(`[Nodemailer] Sent live email to ${to}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, mode: "live" };
    } catch (error) {
      console.error(`[Nodemailer Error] Failed to send email to ${to}:`, error.message);
      recordLog({ to, from: fromAddress, subject, type, status: "failed", error: error.message, mode: "live_smtp", metadata });
      return { success: false, error: error.message, mode: "live" };
    }
  } else {
    // Simulation Mode (ideal for development, demo, and CI/testing environments)
    const logEntry = {
      to,
      from: fromAddress + " (Simulated)",
      subject,
      type,
      status: "delivered",
      messageId: "SIM_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      mode: "simulated",
      metadata,
    };
    recordLog(logEntry);
    console.log(`[Email Service: Simulated Delivery] To: ${to} | Subject: "${subject}"`);
    return { success: true, messageId: logEntry.messageId, mode: "simulated" };
  }
}

/**
 * Send emergency request confirmation email to citizen
 */
async function sendRequestConfirmationEmail({ citizenName, email, disasterType, location, requestId }) {
  const html = buildEmailTemplate({
    heading: "Your Emergency Report Was Received",
    bodyHtml: `
      <p>Dear ${citizenName || "Citizen"},</p>
      <p>Your emergency report has been received and logged in our system.</p>
      <table style="width:100%; font-size: 14px; margin: 12px 0;">
        <tr><td style="color:#6b7280;">Disaster Type</td><td><strong>${disasterType || "N/A"}</strong></td></tr>
        <tr><td style="color:#6b7280;">Location</td><td><strong>${location || "N/A"}</strong></td></tr>
        <tr><td style="color:#6b7280;">Reference #</td><td><strong>${String(requestId).slice(-6)}</strong></td></tr>
      </table>
      <p>Our response team has been notified. You can track the status of your request from your dashboard.</p>
    `,
  });
  return sendEmail({
    to: email,
    subject: "Rapid Relief: Emergency Request Confirmed",
    html,
    type: "request_confirmed",
    metadata: { requestId, disasterType },
  });
}

/**
 * Send volunteer task assignment email
 */
async function sendVolunteerAssignmentEmail({ volunteerName, email, disasterType, location, requestId }) {
  const html = buildEmailTemplate({
    heading: "New Rescue Mission Assigned",
    bodyHtml: `
      <p>Hello ${volunteerName || "Volunteer"},</p>
      <p>You have been assigned to an emergency rescue mission.</p>
      <table style="width:100%; font-size: 14px; margin: 12px 0;">
        <tr><td style="color:#6b7280;">Disaster Type</td><td><strong>${disasterType || "N/A"}</strong></td></tr>
        <tr><td style="color:#6b7280;">Location</td><td><strong>${location || "N/A"}</strong></td></tr>
        <tr><td style="color:#6b7280;">Reference #</td><td><strong>${String(requestId).slice(-6)}</strong></td></tr>
      </table>
      <p>Please check your dashboard for full mission details and proceed with caution.</p>
    `,
  });
  return sendEmail({
    to: email,
    subject: "Rapid Relief: New Rescue Mission Assigned",
    html,
    type: "volunteer_assigned",
    metadata: { requestId, disasterType, location },
  });
}

/**
 * Send request status update email
 */
async function sendStatusUpdateEmail({ citizenName, email, requestId, newStatus }) {
  const html = buildEmailTemplate({
    heading: "Your Request Status Has Changed",
    bodyHtml: `
      <p>Dear ${citizenName || "Citizen"},</p>
      <p>The status of your emergency request (Ref #${String(requestId).slice(-6)}) has been updated to:</p>
      <p style="font-size: 18px; font-weight: bold; color: #2563eb; text-transform: uppercase;">${newStatus}</p>
      <p>Log in to your dashboard for full details.</p>
    `,
  });
  return sendEmail({
    to: email,
    subject: `Rapid Relief: Request Status Updated to "${newStatus}"`,
    html,
    type: "status_updated",
    metadata: { requestId, newStatus },
  });
}

/**
 * Send password reset email with a reset link
 */
async function sendPasswordResetEmail({ name, email, resetToken }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
  const html = buildEmailTemplate({
    heading: "Reset Your Password",
    bodyHtml: `
      <p>Hello ${name || "there"},</p>
      <p>We received a request to reset your Rapid Relief account password. This link expires in 30 minutes.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="background:#2563eb; color:#ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
      <p style="font-size: 12px; color: #6b7280; word-break: break-all;">Link not working? Copy this into your browser: ${resetLink}</p>
    `,
  });
  return sendEmail({
    to: email,
    subject: "Rapid Relief: Password Reset Request",
    html,
    type: "password_reset",
    metadata: {},
  });
}

/**
 * Get recent email transmission history
 */
function getEmailLogs() {
  return emailLogs;
}

/**
 * Get email service configuration status
 */
function getEmailStatus() {
  const emailUser = process.env.NODEMAILER_EMAIL;
  const isConfigured = Boolean(emailUser && !emailUser.includes("replace_with"));
  return {
    configured: isConfigured,
    mode: isConfigured ? "live" : "simulation",
    fromAddress: emailUser || "no-reply@rapidrelief.dev (Simulated)",
    totalSentInSession: emailLogs.length,
  };
}

module.exports = {
  sendEmail,
  sendRequestConfirmationEmail,
  sendVolunteerAssignmentEmail,
  sendStatusUpdateEmail,
  sendPasswordResetEmail,
  getEmailLogs,
  getEmailStatus,
};
