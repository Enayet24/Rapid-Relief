const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getEmergencyLocations, getNearbyShelters } = require("../controllers/mapsController");

router.get("/emergency-locations", protect, getEmergencyLocations);
router.get("/nearby-shelters", protect, getNearbyShelters);

module.exports = router;