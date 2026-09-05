const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: "Shelter", default: null }, // null = central warehouse

    category: {
      type: String,
      enum: ["food", "water", "medicine", "clothing", "shelter", "other"],
      required: true,
    },

    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true }, // e.g. "kg", "liters", "packs"

    lowStockThreshold: { type: Number, default: 10 },
    lastRestockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resourceSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});
resourceSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Resource", resourceSchema);