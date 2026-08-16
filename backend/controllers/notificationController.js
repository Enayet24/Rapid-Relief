const Notification = require("../models/Notification");

// @route GET /api/notifications
async function getMyNotifications(req, res) {
  try {
    const { page, limit, unreadOnly } = req.query;
    const filter = { recipient: req.user.id };
    if (unreadOnly === "true") filter.isRead = false;

    if (page || limit) {
      const pageNum = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * pageSize;

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return res.json({
        notifications,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize) || 1,
        limit: pageSize,
        unreadCount,
      });
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
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

// @route PATCH /api/notifications/read-all
async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead };