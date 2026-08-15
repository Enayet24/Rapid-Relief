const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createShelter,
  getShelters,
  getShelterById,
  updateShelter,
  updateOccupancy,
  deleteShelter,
} = require("../controllers/shelterController");

router.post("/", protect, authorize("admin"), createShelter);
router.get("/", protect, getShelters);
router.get("/:id", protect, getShelterById);
router.patch("/:id", protect, authorize("admin"), updateShelter);
router.patch("/:id/occupancy", protect, authorize("admin"), updateOccupancy);
router.delete("/:id", protect, authorize("admin"), deleteShelter);

module.exports = router;