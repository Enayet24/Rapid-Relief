const EmergencyRequest = require("../models/EmergencyRequest");
const Shelter = require("../models/Shelter");

// @route GET /api/maps/emergency-locations
// Returns active emergency requests with location data, for map pins.
// Citizens see only their own; volunteers/admins see everyone's (active by default).
async function getEmergencyLocations(req, res) {
  try {
    const { includeResolved } = req.query;
    const filter = {};

    if (req.user.role === "citizen") {
      filter.reporter = req.user.id;
    }
    if (includeResolved !== "true") {
      filter.status = { $nin: ["resolved", "cancelled"] };
    }

    const requests = await EmergencyRequest.find(filter)
      .select("disasterType priorityLevel status location numberOfAffectedIndividuals assistanceTypeRequired createdAt reporter")
      .populate("reporter", "name phone");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// @route GET /api/maps/nearby-shelters?lat=..&lng=..&radius=..
// Geospatial query using the 2dsphere index already on Shelter.location.
// radius is in kilometers, defaults to 15.
async function getNearbyShelters(req, res) {
  try {
    const { lat, lng, radius } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius) || 15;

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ message: "lat and lng query parameters are required" });
    }

    const shelters = await Shelter.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distanceMeters",
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: { status: { $ne: "closed" } },
        },
      },
      { $sort: { distanceMeters: 1 } },
    ]);

    const withKm = shelters.map((s) => ({ ...s, distanceKm: Math.round((s.distanceMeters / 1000) * 10) / 10 }));
    res.json(withKm);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getEmergencyLocations, getNearbyShelters };