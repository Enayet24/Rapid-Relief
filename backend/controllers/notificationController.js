const Notification = require("../models/Notification");

// @route GET /api/notifications
async function getMyNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route PATCH /api/notifications/:id/read
async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getMyNotifications, markAsRead };
