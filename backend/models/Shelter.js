const mongoose = require("mongoose");

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

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

    capacity: { type: Number, required: true, min: 1 },
    currentOccupancy: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["open", "full", "closed"],
      default: "open",
    },

    contactPerson: { type: String, trim: true },
    contactPhone: { type: String, trim: true },

    facilities: [{ type: String }], // e.g. "medical", "food", "water", "power"

    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Keep status in sync with occupancy whenever it changes
shelterSchema.pre("save", function () {
  if (this.status !== "closed") {
    this.status = this.currentOccupancy >= this.capacity ? "full" : "open";
  }
});


shelterSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shelter", shelterSchema);