const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getDashboardSummary, generateReport } = require("../controllers/analyticsController");

// Admin only endpoints for analytics & reports
router.get("/dashboard", protect, authorize("admin"), getDashboardSummary);
router.get("/reports", protect, authorize("admin"), generateReport);

module.exports = router;
