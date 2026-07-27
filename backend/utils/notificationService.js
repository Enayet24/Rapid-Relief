const Notification = require("../models/Notification");

/**
 * Central place to fire a notification. Creates the in-app record now,
 * and is the single hook point for Iffat's email + Ariful's push integrations
 * later (call them here instead of duplicating notify logic in controllers).
 */
async function notify({ recipientId, type, message, relatedRequestId = null }) {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    message,
    relatedRequest: relatedRequestId,
  });

  // TODO (Iffat): send email via Nodemailer here
  // TODO (Ariful): send push via OneSignal here

  return notification;
}

module.exports = { notify };
