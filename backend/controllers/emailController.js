const { sendEmail, getEmailLogs, getEmailStatus } = require("../utils/emailService");
const User = require("../models/User");

/**
 * Email Controller
 * Module 3 - Assigned to: Iffat Islam Aria
 */

// @route GET /api/email/logs
// @access Admin
function getTransmissionLogs(req, res) {
  try {
    const logs = getEmailLogs();
    const status = getEmailStatus();
    res.json({ status, logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve email logs", error: err.message });
  }
}

// @route GET /api/email/status
// @access Admin
function getServiceStatus(req, res) {
  res.json(getEmailStatus());
}

// @route POST /api/email/test
// Sends a test email to the currently logged-in admin, to verify SMTP setup.
// @access Admin
async function sendTestEmail(req, res) {
  try {
    let recipient = req.body.to;
    if (!recipient) {
      const currentUser = await User.findById(req.user.id).select("email");
      recipient = currentUser?.email;
    }
    if (!recipient) return res.status(400).json({ message: "No recipient email found" });

    const result = await sendEmail({
      to: recipient,
      subject: "Rapid Relief: Test Email",
      html: "<p>This is a test email confirming your Nodemailer configuration is working.</p>",
      type: "general",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to send test email", error: err.message });
  }
}

module.exports = { getTransmissionLogs, getServiceStatus, sendTestEmail };
