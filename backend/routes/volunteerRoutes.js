const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getVolunteers,
  updateVolunteerStatus,
  assignTask,
  getMyTasks,
  updateTaskStatus,
  getWeather,
} = require("../controllers/volunteerController");

// Admin routes
router.get("/", protect, authorize("admin"), getVolunteers);
router.put("/assign-task", protect, authorize("admin"), assignTask);
router.put("/:id/status", protect, authorize("admin"), updateVolunteerStatus);

// Volunteer routes
router.get("/my-tasks", protect, authorize("volunteer"), getMyTasks);
router.put("/tasks/:id/status", protect, authorize("volunteer"), updateTaskStatus);

// Weather API route (authenticated users)
router.get("/weather", protect, getWeather);

module.exports = router;
