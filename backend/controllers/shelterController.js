const Shelter = require("../models/Shelter");
const { notifyAdmins } = require("../utils/notificationService");

// A shelter counts as "nearing capacity" once occupancy hits this fraction of capacity —
// used to alert admins before it actually hits "full" (Module 2 occupancy monitoring).
const NEAR_CAPACITY_RATIO = 0.9;

function isNearOrFullCapacity(shelter) {
  if (!shelter.capacity) return false;
  return shelter.currentOccupancy / shelter.capacity >= NEAR_CAPACITY_RATIO;
}

// @route POST /api/shelters  @access admin
async function createShelter(req, res) {
  try {
    const shelter = await Shelter.create({ ...req.body, managedBy: req.user.id });
    res.status(201).json(shelter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route GET /api/shelters  (all authenticated users — citizens need to see this too, FR7)
async function getShelters(req, res) {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const shelters = await Shelter.find(filter).sort({ createdAt: -1 });
    res.json(shelters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getShelterById(req, res) {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) return res.status(404).json({ message: "Shelter not found" });
    res.json(shelter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route PATCH /api/shelters/:id  @access admin
async function updateShelter(req, res) {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) return res.status(404).json({ message: "Shelter not found" });

    const wasNearOrFull = isNearOrFullCapacity(shelter);

    Object.assign(shelter, req.body);
    await shelter.save(); // triggers pre-save status sync

    // Module 2: alert admins the first time this shelter crosses into near/full capacity
    if (isNearOrFullCapacity(shelter) && !wasNearOrFull) {
      notifyAdmins({
        type: "shelter_capacity_alert",
        message: `"${shelter.name}" is nearing capacity (${shelter.currentOccupancy}/${shelter.capacity} occupied).`,
      }).catch((err) => console.warn("[Shelter] capacity notify error:", err.message));
    }

    res.json(shelter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route PATCH /api/shelters/:id/occupancy  @access admin
async function updateOccupancy(req, res) {
  try {
    const { currentOccupancy } = req.body;
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) return res.status(404).json({ message: "Shelter not found" });

    const wasNearOrFull = isNearOrFullCapacity(shelter);

    shelter.currentOccupancy = currentOccupancy;
    await shelter.save();

    // Module 2: alert admins the first time this shelter crosses into near/full capacity
    if (isNearOrFullCapacity(shelter) && !wasNearOrFull) {
      notifyAdmins({
        type: "shelter_capacity_alert",
        message: `"${shelter.name}" is nearing capacity (${shelter.currentOccupancy}/${shelter.capacity} occupied).`,
      }).catch((err) => console.warn("[Shelter] capacity notify error:", err.message));
    }

    res.json(shelter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route DELETE /api/shelters/:id  @access admin
async function deleteShelter(req, res) {
  try {
    const shelter = await Shelter.findByIdAndDelete(req.params.id);
    if (!shelter) return res.status(404).json({ message: "Shelter not found" });
    res.json({ message: "Shelter deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { createShelter, getShelters, getShelterById, updateShelter, updateOccupancy, deleteShelter };