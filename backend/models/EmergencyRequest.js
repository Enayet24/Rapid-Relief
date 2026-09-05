const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    disasterType: {
      type: String,
      enum: ["flood", "cyclone", "earthquake", "fire", "landslide", "other"],
      required: true,
    },

    // GeoJSON point for Google Maps integration
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: { type: String, trim: true },
    },

    numberOfAffectedIndividuals: { type: Number, required: true, min: 1 },

    assistanceTypeRequired: {
      type: String,
      enum: ["rescue", "medical", "food", "shelter", "water", "other"],
      required: true,
    },

    description: { type: String, trim: true },

    // Auto-calculated by utils/priorityClassifier.js — never set manually
    priorityLevel: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    priorityScore: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "resolved", "cancelled"],
      default: "pending",
    },

    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    taskStatus: {
      type: String,
      enum: ["unassigned", "assigned", "in-progress", "completed"],
      default: "unassigned",
    },

    completionReport: {
      notes: { type: String, trim: true },
      resolvedAt: { type: Date },
    },

    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

emergencyRequestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);
