const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createResource,
  getResources,
  updateResource,
  deleteResource,
} = require("../controllers/resourceController");

router.post("/", protect, authorize("admin"), createResource);
router.get("/", protect, authorize("admin"), getResources);
router.patch("/:id", protect, authorize("admin"), updateResource);
router.delete("/:id", protect, authorize("admin"), deleteResource);

module.exports = router;