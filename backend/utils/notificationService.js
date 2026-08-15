const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendSMS } = require("./smsService");

/**
 * Central place to fire notifications across the platform.
 * Creates the in-app notification record and dispatches SMS/Email.
 * (SMS Integration by: Ariful Islam Bijoy)
 */
async function notify({ recipientId, type, message, relatedRequestId = null, sendSmsAlert = true }) {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    message,
    relatedRequest: relatedRequestId,
  });

  // SMS Notification Dispatch (Module 3 - Ariful Islam Bijoy)
  if (sendSmsAlert && recipientId) {
    try {
      const recipientUser = await User.findById(recipientId).select("name phone role");
      if (recipientUser && recipientUser.phone) {
        await sendSMS({
          to: recipientUser.phone,
          body: `🚨 Rapid Relief: ${message}`,
          type: type === "request_confirmed" ? "critical_alert" : "general",
          metadata: {
            recipientId: recipientUser._id,
            relatedRequestId,
            type,
          },
        });
      }
    } catch (smsErr) {
      console.warn("[NotificationService] SMS dispatch error:", smsErr.message);
    }
  }

  // TODO (Iffat): send email via Nodemailer here

  return notification;
}

module.exports = { notify };
