const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getTransmissionLogs, getServiceStatus, sendTestEmail } = require("../controllers/emailController");

// Protected endpoints for email notification integration
router.get("/logs", protect, authorize("admin"), getTransmissionLogs);
router.get("/status", protect, authorize("admin"), getServiceStatus);
router.post("/test", protect, authorize("admin"), sendTestEmail);

module.exports = router;
