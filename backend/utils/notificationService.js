const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendSMS } = require("./smsService");
const { sendEmail } = require("./emailService");

/**
 * Central place to fire notifications across the platform.
 * Creates the in-app notification record and dispatches SMS/Email.
 * (SMS Integration by: Ariful Islam Bijoy)
 * (Email Integration by: Iffat Islam Aria)
 */
async function notify({ recipientId, type, message, relatedRequestId = null, sendSmsAlert = true, sendEmailAlert = true }) {
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

  // Email Notification Dispatch (Module 3 - Iffat Islam Aria)
  if (sendEmailAlert && recipientId) {
    try {
      const recipientUser = await User.findById(recipientId).select("name email");
      if (recipientUser && recipientUser.email) {
        await sendEmail({
          to: recipientUser.email,
          subject: `Rapid Relief: ${message.length > 60 ? message.slice(0, 57) + "..." : message}`,
          html: `<p>Hello ${recipientUser.name || "there"},</p><p>${message}</p>`,
          type,
          metadata: { recipientId: recipientUser._id, relatedRequestId, type },
        });
      }
    } catch (emailErr) {
      console.warn("[NotificationService] Email dispatch error:", emailErr.message);
    }
  }

  return notification;
}

/**
 * Fan a single alert out to every admin account. Used for system-level alerts
 * (low stock, shelter nearing capacity) that don't have one specific citizen
 * or volunteer recipient — every admin needs to see them.
 * (Module 2 - Iffat Islam Aria: inventory alerts & occupancy monitoring)
 */
async function notifyAdmins({ type, message, relatedRequestId = null, sendSmsAlert = false, sendEmailAlert = true }) {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id");
  return Promise.all(
    admins.map((admin) =>
      notify({ recipientId: admin._id, type, message, relatedRequestId, sendSmsAlert, sendEmailAlert })
    )
  );
}

module.exports = { notify, notifyAdmins };
