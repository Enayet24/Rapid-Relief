const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // stored hashed (bcrypt)
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["citizen", "volunteer", "admin"],
      default: "citizen",
    },
    // Volunteer-specific fields (used only when role === 'volunteer')
    isApprovedVolunteer: { type: Boolean, default: false },
    skills: [{ type: String }],
    isActive: { type: Boolean, default: true },

    // Password recovery (Module 3 - Iffat Islam Aria: Nodemailer email integration)
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
