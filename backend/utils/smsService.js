/**
 * SMS Notification Integration (Twilio)
 * Module 3 - External API Integration (Assigned to: Ariful Islam Bijoy)
 * 
 * Provides automated and on-demand SMS notifications for:
 * 1. Critical emergency alerts (to citizens & dispatchers)
 * 2. Volunteer task assignments & mission dispatch
 * 3. Urgent shelter announcements & evacuation alerts
 * 4. Broadcast emergency alerts across citizen/volunteer channels
 *
 * Includes dual-mode operation:
 * - Live Mode: Transmits via Twilio API when credentials are provided in .env
 * - Simulation Mode: Formats, validates, and logs SMS delivery when running without Twilio keys,
 *   enabling seamless testing and presentation without external API costs/limits.
 */

let twilioClient = null;

// Initialize Twilio client if credentials are provided
function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken && !accountSid.includes("replace_with")) {
    try {
      const twilio = require("twilio");
      twilioClient = twilio(accountSid, authToken);
      return twilioClient;
    } catch (err) {
      console.warn("[Twilio SMS] Failed to initialize twilio client:", err.message);
      return null;
    }
  }
  return null;
}

// In-memory transmission log buffer (persisted per server session for admin monitoring)
const smsLogs = [];
const MAX_LOG_HISTORY = 100;

function recordLog(entry) {
  smsLogs.unshift({
    id: "sms_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (smsLogs.length > MAX_LOG_HISTORY) {
    smsLogs.pop();
  }
}

/**
 * Send an SMS message to a phone number.
 * @param {Object} options
 * @param {string} options.to - Recipient phone number (e.g. "+8801700000000")
 * @param {string} options.body - Text message content
 * @param {string} [options.type='general'] - Category: 'critical_alert'|'volunteer_assignment'|'shelter_announcement'|'broadcast'|'general'
 * @param {Object} [options.metadata] - Extra metadata (requestId, shelterId, etc.)
 */
async function sendSMS({ to, body, type = "general", metadata = {} }) {
  if (!to) {
    console.warn("[SMS Service] Skipped sending SMS: No phone number provided.");
    return { success: false, reason: "No recipient phone number provided" };
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || "+18005550199";
  const client = getTwilioClient();

  if (client) {
    try {
      const message = await client.messages.create({
        body,
        from: fromNumber,
        to,
      });

      const logEntry = {
        to,
        from: fromNumber,
        body,
        type,
        status: "delivered",
        sid: message.sid,
        mode: "live_twilio",
        metadata,
      };
      recordLog(logEntry);
      console.log(`[Twilio SMS] Sent live message to ${to}. SID: ${message.sid}`);
      return { success: true, sid: message.sid, mode: "live" };
    } catch (error) {
      console.error(`[Twilio SMS Error] Failed to send SMS to ${to}:`, error.message);
      const logEntry = {
        to,
        from: fromNumber,
        body,
        type,
        status: "failed",
        error: error.message,
        mode: "live_twilio",
        metadata,
      };
      recordLog(logEntry);
      return { success: false, error: error.message, mode: "live" };
    }
  } else {
    // Simulation Mode (ideal for development, demo, and CI/testing environments)
    const logEntry = {
      to,
      from: fromNumber + " (Simulated)",
      body,
      type,
      status: "delivered",
      sid: "SIM_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      mode: "simulated",
      metadata,
    };
    recordLog(logEntry);
    console.log(`[SMS Service: Simulated Delivery] To: ${to} | Type: ${type} | Message: "${body}"`);
    return { success: true, sid: logEntry.sid, mode: "simulated" };
  }
}

/**
 * Send critical emergency alert SMS to citizen
 */
async function sendCriticalEmergencyAlert({ citizenName, phone, disasterType, location, requestId }) {
  const body = `🚨 [RAPID RELIEF CRITICAL ALERT] Dear ${citizenName || "Citizen"}, your emergency report for ${disasterType?.toUpperCase() || "DISASTER"} at ${location || "your location"} has been marked CRITICAL. Emergency response teams and nearest shelters have been notified. Stay in a safe place. Ref #${String(requestId).slice(-6)}`;
  return sendSMS({
    to: phone,
    body,
    type: "critical_alert",
    metadata: { requestId, disasterType },
  });
}

/**
 * Send volunteer task assignment SMS notification
 */
async function sendVolunteerAssignmentAlert({ volunteerName, phone, disasterType, location, numberOfAffected, requestId }) {
  const body = `🦺 [RAPID RELIEF RESCUE DISPATCH] Hello ${volunteerName}, you have been assigned to an emergency rescue mission! Disaster: ${disasterType} | Location: ${location} | Affected: ${numberOfAffected || 1} people. Please check your dashboard and proceed with caution. Ref #${String(requestId).slice(-6)}`;
  return sendSMS({
    to: phone,
    body,
    type: "volunteer_assignment",
    metadata: { requestId, disasterType, location },
  });
}

/**
 * Send shelter announcement or evacuation alert SMS
 */
async function sendShelterAnnouncementSMS({ phone, shelterName, address, status, message }) {
  const body = `🏠 [RAPID RELIEF SHELTER UPDATE] Notice regarding ${shelterName} (${address}): ${message || `Current Status: ${status}`}. Contact administration for emergency shelter assistance.`;
  return sendSMS({
    to: phone,
    body,
    type: "shelter_announcement",
    metadata: { shelterName, status },
  });
}

/**
 * Broadcast custom emergency SMS alert
 */
async function broadcastSMS({ recipients = [], message, alertType = "broadcast" }) {
  const results = [];
  for (const recipient of recipients) {
    if (recipient.phone) {
      const res = await sendSMS({
        to: recipient.phone,
        body: `📢 [RAPID RELIEF EMERGENCY BROADCAST] ${message}`,
        type: alertType,
        metadata: { recipientName: recipient.name, role: recipient.role },
      });
      results.push({ phone: recipient.phone, name: recipient.name, ...res });
    }
  }
  return results;
}

/**
 * Get recent SMS transmission history
 */
function getSMSLogs() {
  return smsLogs;
}

/**
 * Get SMS service configuration status
 */
function getSMSStatus() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const isConfigured = Boolean(accountSid && !accountSid.includes("replace_with"));
  return {
    configured: isConfigured,
    mode: isConfigured ? "live" : "simulation",
    fromNumber: process.env.TWILIO_PHONE_NUMBER || "+18005550199 (Simulated)",
    totalSentInSession: smsLogs.length,
  };
}

module.exports = {
  sendSMS,
  sendCriticalEmergencyAlert,
  sendVolunteerAssignmentAlert,
  sendShelterAnnouncementSMS,
  broadcastSMS,
  getSMSLogs,
  getSMSStatus,
};
