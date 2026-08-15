const { sendSMS, broadcastSMS, getSMSLogs, getSMSStatus } = require("../utils/smsService");
const User = require("../models/User");

/**
 * SMS Controller
 * Module 3 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */

// @route POST /api/sms/send
// @access Admin
async function sendDirectSMS(req, res) {
  try {
    const { to, body, type } = req.body;
    if (!to || !body) {
      return res.status(400).json({ message: "Recipient phone ('to') and message text ('body') are required." });
    }

    const result = await sendSMS({ to, body, type: type || "direct_admin" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to send SMS", error: err.message });
  }
}

// @route POST /api/sms/broadcast
// @access Admin
async function broadcastEmergencySMS(req, res) {
  try {
    const { message, targetRole = "all", alertType = "emergency_broadcast" } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Broadcast message is required." });
    }

    const filter = { phone: { $exists: true, $ne: "" } };
    if (targetRole === "volunteer" || targetRole === "citizen") {
      filter.role = targetRole;
    }

    const users = await User.find(filter).select("name phone role");

    const broadcastResults = await broadcastSMS({
      recipients: users,
      message,
      alertType,
    });

    res.json({
      success: true,
      targetRole,
      totalRecipientsFound: users.length,
      dispatchedCount: broadcastResults.length,
      details: broadcastResults,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to broadcast SMS alert", error: err.message });
  }
}

// @route GET /api/sms/logs
// @access Admin
function getTransmissionLogs(req, res) {
  try {
    const logs = getSMSLogs();
    const status = getSMSStatus();
    res.json({ status, logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve SMS logs", error: err.message });
  }
}

// @route GET /api/sms/status
// @access Admin, Volunteer
function getServiceStatus(req, res) {
  res.json(getSMSStatus());
}

module.exports = {
  sendDirectSMS,
  broadcastEmergencySMS,
  getTransmissionLogs,
  getServiceStatus,
};
