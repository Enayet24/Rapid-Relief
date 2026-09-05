const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  sendDirectSMS,
  broadcastEmergencySMS,
  getTransmissionLogs,
  getServiceStatus,
} = require("../controllers/smsController");

// Protected endpoints for SMS notification integration
router.post("/send", protect, authorize("admin"), sendDirectSMS);
router.post("/broadcast", protect, authorize("admin"), broadcastEmergencySMS);
router.get("/logs", protect, authorize("admin"), getTransmissionLogs);
router.get("/status", protect, getServiceStatus);

module.exports = router;
