const Resource = require("../models/Resource");

// @route POST /api/resources  @access admin
async function createResource(req, res) {
  try {
    const resource = await Resource.create(req.body);
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route GET /api/resources?lowStock=true&shelter=<id>  @access admin
async function getResources(req, res) {
  try {
    const { shelter, category } = req.query;
    const filter = {};
    if (shelter) filter.shelter = shelter;
    if (category) filter.category = category;

    let resources = await Resource.find(filter).populate("shelter", "name").sort({ category: 1 });

    if (req.query.lowStock === "true") {
      resources = resources.filter((r) => r.quantity <= r.lowStockThreshold);
    }

    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route PATCH /api/resources/:id  @access admin
async function updateResource(req, res) {
  try {
    const updates = { ...req.body };
    if (updates.quantity !== undefined) updates.lastRestockedAt = Date.now();

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route DELETE /api/resources/:id  @access admin
async function deleteResource(req, res) {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json({ message: "Resource deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { createResource, getResources, updateResource, deleteResource };