const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: [
        "request_confirmed",
        "volunteer_assigned",
        "status_updated",
        "shelter_announcement",
        "low_stock_alert",
        "shelter_capacity_alert",
        "general",
      ],
      required: true,
    },

    message: { type: String, required: true },

    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: "EmergencyRequest", default: null },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
