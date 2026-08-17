const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;