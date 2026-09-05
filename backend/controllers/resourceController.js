const Resource = require("../models/Resource");
const { notifyAdmins } = require("../utils/notificationService");

// @route POST /api/resources  @access admin
async function createResource(req, res) {
  try {
    const resource = await Resource.create(req.body);

    // Module 2: alert admins if the item starts out already at/below its threshold
    if (resource.quantity <= resource.lowStockThreshold) {
      notifyAdmins({
        type: "low_stock_alert",
        message: `New item "${resource.name}" was added already low on stock (${resource.quantity} ${resource.unit} left).`,
      }).catch((err) => console.warn("[Resource] low-stock notify error:", err.message));
    }

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
    const existing = await Resource.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Resource not found" });

    const wasLow = existing.quantity <= existing.lowStockThreshold;

    const updates = { ...req.body };
    if (updates.quantity !== undefined) updates.lastRestockedAt = Date.now();

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Module 2: alert admins the first time an item crosses into low stock, not on every save while it stays low
    const isLowNow = resource.quantity <= resource.lowStockThreshold;
    if (isLowNow && !wasLow) {
      notifyAdmins({
        type: "low_stock_alert",
        message: `"${resource.name}" has dropped to ${resource.quantity} ${resource.unit} — at or below the low-stock threshold (${resource.lowStockThreshold}).`,
      }).catch((err) => console.warn("[Resource] low-stock notify error:", err.message));
    }

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