const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorName: { type: String, required: true, trim: true },
    donorContact: { type: String, trim: true },

    donationType: {
      type: String,
      enum: ["cash", "goods"],
      required: true,
    },

    amount: { type: Number, min: 0 }, // used when donationType === 'cash'
    itemDescription: { type: String, trim: true }, // used when donationType === 'goods'
    quantity: { type: Number, min: 0 },

    linkedResource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", default: null },
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "Shelter", default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["pending", "received", "allocated"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);