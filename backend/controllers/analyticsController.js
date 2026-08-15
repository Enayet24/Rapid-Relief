const EmergencyRequest = require("../models/EmergencyRequest");
const Shelter = require("../models/Shelter");
const Resource = require("../models/Resource");
const Donation = require("../models/Donation");
const User = require("../models/User");

/**
 * Administrative Dashboard & Analytics Controller
 * Module 1 & 2 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */

// @route GET /api/analytics/dashboard
// @access Admin
async function getDashboardSummary(req, res) {
  try {
    // 1. Emergency Requests Aggregation
    const totalRequests = await EmergencyRequest.countDocuments();
    const pendingRequests = await EmergencyRequest.countDocuments({ status: "pending" });
    const assignedRequests = await EmergencyRequest.countDocuments({ status: "assigned" });
    const inProgressRequests = await EmergencyRequest.countDocuments({ status: "in_progress" });
    const resolvedRequests = await EmergencyRequest.countDocuments({ status: "resolved" });
    const cancelledRequests = await EmergencyRequest.countDocuments({ status: "cancelled" });

    const criticalRequests = await EmergencyRequest.countDocuments({ priorityLevel: "critical" });
    const highRequests = await EmergencyRequest.countDocuments({ priorityLevel: "high" });
    const mediumRequests = await EmergencyRequest.countDocuments({ priorityLevel: "medium" });
    const lowRequests = await EmergencyRequest.countDocuments({ priorityLevel: "low" });

    // Aggregate affected individuals sum
    const affectedStats = await EmergencyRequest.aggregate([
      { $group: { _id: null, totalAffected: { $sum: "$numberOfAffectedIndividuals" } } },
    ]);
    const totalAffectedIndividuals = affectedStats.length > 0 ? affectedStats[0].totalAffected : 0;

    // Disaster Type Breakdown
    const disasterBreakdown = await EmergencyRequest.aggregate([
      { $group: { _id: "$disasterType", count: { $sum: 1 }, affected: { $sum: "$numberOfAffectedIndividuals" } } },
      { $sort: { count: -1 } },
    ]);

    // Assistance Type Breakdown
    const assistanceBreakdown = await EmergencyRequest.aggregate([
      { $group: { _id: "$assistanceTypeRequired", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 2. Shelter Statistics
    const shelters = await Shelter.find();
    const totalShelters = shelters.length;
    let totalShelterCapacity = 0;
    let totalShelterOccupancy = 0;
    let openShelters = 0;
    let fullShelters = 0;

    shelters.forEach((s) => {
      totalShelterCapacity += s.capacity || 0;
      totalShelterOccupancy += s.currentOccupancy || 0;
      if (s.status === "open") openShelters++;
      if (s.status === "full") fullShelters++;
    });

    const overallOccupancyRate = totalShelterCapacity > 0
      ? Math.round((totalShelterOccupancy / totalShelterCapacity) * 100)
      : 0;

    // 3. Resource Inventory Statistics
    const resources = await Resource.find();
    const totalResourceItems = resources.length;
    let lowStockCount = 0;
    const resourceCategories = {};

    resources.forEach((r) => {
      if (r.quantity <= r.lowStockThreshold) {
        lowStockCount++;
      }
      resourceCategories[r.category] = (resourceCategories[r.category] || 0) + r.quantity;
    });

    // 4. Donation Statistics
    const donations = await Donation.find();
    const totalDonations = donations.length;
    let allocatedDonations = 0;
    let pendingDonations = 0;
    let totalMonetaryDonations = 0;

    donations.forEach((d) => {
      if (d.status === "allocated") allocatedDonations++;
      if (d.status === "received") pendingDonations++;
      if (d.type === "money" && d.amount) {
        totalMonetaryDonations += d.amount;
      }
    });

    // 5. User & Volunteer Statistics
    const totalCitizens = await User.countDocuments({ role: "citizen" });
    const totalVolunteers = await User.countDocuments({ role: "volunteer" });
    const approvedVolunteers = await User.countDocuments({ role: "volunteer", isApprovedVolunteer: true });

    // 6. Recent Critical Activity / Top Priority Requests
    const recentCriticalRequests = await EmergencyRequest.find({ priorityLevel: { $in: ["critical", "high"] } })
      .populate("reporter", "name phone email")
      .populate("assignedVolunteer", "name phone")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests,
        activeRequests: pendingRequests + assignedRequests + inProgressRequests,
        pendingRequests,
        assignedRequests,
        inProgressRequests,
        resolvedRequests,
        cancelledRequests,
        criticalRequests,
        highRequests,
        mediumRequests,
        lowRequests,
        totalAffectedIndividuals,
        totalShelters,
        openShelters,
        fullShelters,
        totalShelterCapacity,
        totalShelterOccupancy,
        overallOccupancyRate,
        totalResourceItems,
        lowStockCount,
        totalDonations,
        allocatedDonations,
        pendingDonations,
        totalMonetaryDonations,
        totalCitizens,
        totalVolunteers,
        approvedVolunteers,
      },
      charts: {
        disasterBreakdown: disasterBreakdown.map((d) => ({
          type: d._id,
          count: d.count,
          affected: d.affected,
        })),
        assistanceBreakdown: assistanceBreakdown.map((a) => ({
          type: a._id,
          count: a.count,
        })),
        priorityDistribution: [
          { level: "critical", count: criticalRequests },
          { level: "high", count: highRequests },
          { level: "medium", count: mediumRequests },
          { level: "low", count: lowRequests },
        ],
        shelterOccupancy: {
          capacity: totalShelterCapacity,
          occupancy: totalShelterOccupancy,
          available: Math.max(0, totalShelterCapacity - totalShelterOccupancy),
          rate: overallOccupancyRate,
        },
        resourceCategories,
      },
      recentCriticalRequests,
    });
  } catch (err) {
    console.error("[Analytics Error]", err);
    res.status(500).json({ message: "Failed to generate analytics summary", error: err.message });
  }
}

// @route GET /api/analytics/reports
// @access Admin
async function generateReport(req, res) {
  try {
    const { reportType = "summary", format = "json", status, priorityLevel, disasterType } = req.query;

    if (reportType === "requests" || reportType === "summary") {
      const filter = {};
      if (status) filter.status = status;
      if (priorityLevel) filter.priorityLevel = priorityLevel;
      if (disasterType) filter.disasterType = disasterType;

      const requests = await EmergencyRequest.find(filter)
        .populate("reporter", "name phone email")
        .populate("assignedVolunteer", "name phone")
        .sort({ createdAt: -1 });

      if (format === "csv") {
        let csvContent = "ID,Disaster Type,Assistance Type,Affected People,Priority,Status,Address,Reporter Name,Reporter Phone,Created Date\n";
        requests.forEach((r) => {
          const row = [
            `"${r._id}"`,
            `"${r.disasterType}"`,
            `"${r.assistanceTypeRequired}"`,
            r.numberOfAffectedIndividuals || 0,
            `"${r.priorityLevel}"`,
            `"${r.status}"`,
            `"${(r.location?.address || "").replace(/"/g, '""')}"`,
            `"${r.reporter?.name || "N/A"}"`,
            `"${r.reporter?.phone || "N/A"}"`,
            `"${new Date(r.createdAt).toLocaleString()}"`,
          ].join(",");
          csvContent += row + "\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=emergency_requests_report_${Date.now()}.csv`);
        return res.send(csvContent);
      }

      return res.json({
        reportType: "Emergency Requests Report",
        generatedAt: new Date().toISOString(),
        totalRecords: requests.length,
        data: requests,
      });
    }

    if (reportType === "shelters") {
      const shelters = await Shelter.find().populate("managedBy", "name email");
      if (format === "csv") {
        let csvContent = "ID,Shelter Name,Address,Capacity,Current Occupancy,Occupancy %,Status,Contact Phone\n";
        shelters.forEach((s) => {
          const pct = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
          const row = [
            `"${s._id}"`,
            `"${s.name.replace(/"/g, '""')}"`,
            `"${(s.location?.address || "").replace(/"/g, '""')}"`,
            s.capacity,
            s.currentOccupancy,
            `${pct}%`,
            `"${s.status}"`,
            `"${s.contactPhone || ""}"`,
          ].join(",");
          csvContent += row + "\n";
        });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=shelters_report_${Date.now()}.csv`);
        return res.send(csvContent);
      }
      return res.json({
        reportType: "Shelter Status Report",
        generatedAt: new Date().toISOString(),
        totalRecords: shelters.length,
        data: shelters,
      });
    }

    if (reportType === "resources") {
      const resources = await Resource.find().populate("shelter", "name");
      if (format === "csv") {
        let csvContent = "ID,Item Name,Category,Quantity,Unit,Low Stock Threshold,Is Low Stock,Shelter Location\n";
        resources.forEach((r) => {
          const isLow = r.quantity <= r.lowStockThreshold ? "YES" : "NO";
          const row = [
            `"${r._id}"`,
            `"${r.name.replace(/"/g, '""')}"`,
            `"${r.category}"`,
            r.quantity,
            `"${r.unit}"`,
            r.lowStockThreshold,
            `"${isLow}"`,
            `"${r.shelter?.name || "General Warehouse"}"`,
          ].join(",");
          csvContent += row + "\n";
        });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=resource_inventory_report_${Date.now()}.csv`);
        return res.send(csvContent);
      }
      return res.json({
        reportType: "Resource Inventory Report",
        generatedAt: new Date().toISOString(),
        totalRecords: resources.length,
        data: resources,
      });
    }

    res.status(400).json({ message: "Invalid report type" });
  } catch (err) {
    console.error("[Report Generation Error]", err);
    res.status(500).json({ message: "Failed to generate report", error: err.message });
  }
}

module.exports = {
  getDashboardSummary,
  generateReport,
};
