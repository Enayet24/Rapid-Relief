const Donation = require("../models/Donation");
const Resource = require("../models/Resource");

// @route POST /api/donations  @access admin
async function createDonation(req, res) {
  try {
    const donation = await Donation.create({ ...req.body, receivedBy: req.user.id });
    res.status(201).json(donation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route GET /api/donations  @access admin
async function getDonations(req, res) {
  try {
    const donations = await Donation.find()
      .populate("receivedBy", "name")
      .populate("shelter", "name")
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route PATCH /api/donations/:id/status  @access admin
// Marking goods donations "allocated" tops up the linked resource's quantity.
async function updateDonationStatus(req, res) {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const wasAllocated = donation.status === "allocated";
    donation.status = status;
    await donation.save();

    if (status === "allocated" && !wasAllocated && donation.linkedResource) {
      await Resource.findByIdAndUpdate(donation.linkedResource, {
        $inc: { quantity: donation.quantity || 0 },
        lastRestockedAt: Date.now(),
      });
    }

    res.json(donation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { createDonation, getDonations, updateDonationStatus };