const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createDonation,
  getDonations,
  updateDonationStatus,
} = require("../controllers/donationController");

router.post("/", protect, authorize("admin"), createDonation);
router.get("/", protect, authorize("admin"), getDonations);
router.patch("/:id/status", protect, authorize("admin"), updateDonationStatus);

module.exports = router;