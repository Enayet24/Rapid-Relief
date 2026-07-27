const EmergencyRequest = require("../models/EmergencyRequest");
const { classifyPriority } = require("../utils/priorityClassifier");
const { notify } = require("../utils/notificationService");

// @route POST /api/requests
// @access citizen
async function createRequest(req, res) {
  try {
    const { disasterType, location, numberOfAffectedIndividuals, assistanceTypeRequired, description } = req.body;

    const { priorityScore, priorityLevel } = classifyPriority({
      disasterType,
      assistanceTypeRequired,
      numberOfAffectedIndividuals,
      description,
    });

    const request = await EmergencyRequest.create({
      reporter: req.user.id,
      disasterType,
      location,
      numberOfAffectedIndividuals,
      assistanceTypeRequired,
      description,
      priorityScore,
      priorityLevel,
      statusHistory: [{ status: "pending", note: "Request submitted" }],
    });

    await notify({
      recipientId: req.user.id,
      type: "request_confirmed",
      message: `Your emergency request has been received (priority: ${priorityLevel}).`,
      relatedRequestId: request._id,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route GET /api/requests  (own requests for citizen, all for admin)
async function getRequests(req, res) {
  try {
    const filter = req.user.role === "citizen" ? { reporter: req.user.id } : {};
    const requests = await EmergencyRequest.find(filter)
      .populate("reporter", "name email phone")
      .populate("assignedVolunteer", "name phone")
      .sort({ priorityScore: -1, createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route GET /api/requests/:id
async function getRequestById(req, res) {
  try {
    const request = await EmergencyRequest.findById(req.params.id)
      .populate("reporter", "name email phone")
      .populate("assignedVolunteer", "name phone");
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route PATCH /api/requests/:id/status
// @access volunteer, admin
async function updateRequestStatus(req, res) {
  try {
    const { status, note } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    request.statusHistory.push({ status, note });
    await request.save();

    await notify({
      recipientId: request.reporter,
      type: "status_updated",
      message: `Your request status changed to: ${status}`,
      relatedRequestId: request._id,
    });

    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { createRequest, getRequests, getRequestById, updateRequestStatus };
