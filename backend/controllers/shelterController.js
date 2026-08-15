const Shelter = require("../models/Shelter");

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

    Object.assign(shelter, req.body);
    await shelter.save(); // triggers pre-save status sync
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

    shelter.currentOccupancy = currentOccupancy;
    await shelter.save();
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