const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");
const { classifyPriority } = require("../utils/priorityClassifier");
const { notify } = require("../utils/notificationService");
const { sendCriticalEmergencyAlert, sendVolunteerAssignmentAlert } = require("../utils/smsService");

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

    // In-app notification
    await notify({
      recipientId: req.user.id,
      type: "request_confirmed",
      message: `Your emergency request has been received (priority: ${priorityLevel}).`,
      relatedRequestId: request._id,
    });

    // Module 3: SMS integration for critical alerts
    if (priorityLevel === "critical" || priorityLevel === "high") {
      try {
        const reporterUser = await User.findById(req.user.id);
        if (reporterUser && reporterUser.phone) {
          await sendCriticalEmergencyAlert({
            citizenName: reporterUser.name,
            phone: reporterUser.phone,
            disasterType,
            location: location?.address || "your reported coordinates",
            requestId: request._id,
          });
        }
      } catch (smsErr) {
        console.warn("[SMS Alert Warning]", smsErr.message);
      }
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route GET /api/requests  (own requests for citizen, all for admin/volunteer with search & filters)
async function getRequests(req, res) {
  try {
    const { status, priorityLevel, disasterType, assistanceType, search, page, limit } = req.query;

    const filter = req.user.role === "citizen" ? { reporter: req.user.id } : {};

    if (status && status !== "all") filter.status = status;
    if (priorityLevel && priorityLevel !== "all") filter.priorityLevel = priorityLevel;
    if (disasterType && disasterType !== "all") filter.disasterType = disasterType;
    if (assistanceType && assistanceType !== "all") filter.assistanceTypeRequired = assistanceType;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { description: searchRegex },
        { "location.address": searchRegex },
        { disasterType: searchRegex },
        { assistanceTypeRequired: searchRegex },
      ];
    }

    // Check if pagination is requested (Module 2 requirement)
    if (page || limit) {
      const pageNum = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * pageSize;

      const total = await EmergencyRequest.countDocuments(filter);
      const requests = await EmergencyRequest.find(filter)
        .populate("reporter", "name email phone")
        .populate("assignedVolunteer", "name phone")
        .sort({ priorityScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return res.json({
        requests,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize) || 1,
        limit: pageSize,
      });
    }

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
    const { status, note, assignedVolunteer } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (status) {
      request.status = status;
      request.statusHistory.push({ status, note: note || `Status updated to ${status}` });
    }

    let newlyAssigned = false;
    if (assignedVolunteer !== undefined && assignedVolunteer !== request.assignedVolunteer?.toString()) {
      request.assignedVolunteer = assignedVolunteer || null;
      if (assignedVolunteer) {
        request.status = "assigned";
        request.statusHistory.push({ status: "assigned", note: "Volunteer assigned to rescue" });
        newlyAssigned = true;
      }
    }

    await request.save();

    // In-app notification to reporter
    await notify({
      recipientId: request.reporter,
      type: "status_updated",
      message: `Your emergency request status changed to: ${request.status}`,
      relatedRequestId: request._id,
    });

    // Module 3: SMS alert to volunteer when assigned
    if (newlyAssigned && request.assignedVolunteer) {
      try {
        const volunteer = await User.findById(request.assignedVolunteer);
        if (volunteer && volunteer.phone) {
          await sendVolunteerAssignmentAlert({
            volunteerName: volunteer.name,
            phone: volunteer.phone,
            disasterType: request.disasterType,
            location: request.location?.address || "Reported coordinates",
            numberOfAffected: request.numberOfAffectedIndividuals,
            requestId: request._id,
          });
        }
      } catch (vErr) {
        console.warn("[Volunteer SMS Alert Warning]", vErr.message);
      }
    }

    const updatedRequest = await EmergencyRequest.findById(req.params.id)
      .populate("reporter", "name email phone")
      .populate("assignedVolunteer", "name phone");

    res.json(updatedRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route PATCH /api/requests/:id/assign
// @access admin
async function assignVolunteer(req, res) {
  try {
    const { volunteerId, note } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.assignedVolunteer = volunteerId;
    request.status = "assigned";
    request.statusHistory.push({ status: "assigned", note: note || "Volunteer assigned by admin" });
    await request.save();

    // SMS dispatch to volunteer
    if (volunteerId) {
      const volunteer = await User.findById(volunteerId);
      if (volunteer && volunteer.phone) {
        await sendVolunteerAssignmentAlert({
          volunteerName: volunteer.name,
          phone: volunteer.phone,
          disasterType: request.disasterType,
          location: request.location?.address || "Reported coordinates",
          numberOfAffected: request.numberOfAffectedIndividuals,
          requestId: request._id,
        });
      }
    }

    const updated = await EmergencyRequest.findById(req.params.id)
      .populate("reporter", "name email phone")
      .populate("assignedVolunteer", "name phone");

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  assignVolunteer,
};
