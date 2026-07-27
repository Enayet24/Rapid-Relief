const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
} = require("../controllers/requestController");

router.post("/", protect, authorize("citizen"), createRequest);
router.get("/", protect, getRequests);
router.get("/:id", protect, getRequestById);
router.patch("/:id/status", protect, authorize("volunteer", "admin"), updateRequestStatus);

module.exports = router;
