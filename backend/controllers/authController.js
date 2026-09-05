const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/emailService");

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// @route POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, phone, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role: role === "volunteer" ? "volunteer" : "citizen", // admin accounts created manually, not via public signup
    });

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: generateToken(user),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route POST /api/auth/forgot-password
// (Module 3 - Iffat Islam Aria: Nodemailer password recovery)
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way whether or not the email exists —
    // avoids leaking which addresses are registered to an attacker.
    const genericResponse = { message: "If that email is registered, a reset link has been sent." };
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    await sendPasswordResetEmail({ name: user.name, email: user.email, resetToken: rawToken });

    res.json(genericResponse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// @route POST /api/auth/reset-password
// (Module 3 - Iffat Islam Aria: Nodemailer password recovery)
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { register, login, forgotPassword, resetPassword };
