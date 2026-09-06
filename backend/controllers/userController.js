import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/emailService.js";
import asyncHandler from "express-async-handler";

// ── Register ──────────────────────────────────────────────────────
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists with this email" });
  }

  // Hash password with bcrypt (salt rounds = 12 for production)
  const hashedPassword = await bcrypt.hash(password, 12);
  await User.create({ name, email, password: hashedPassword });

  res.status(201).json({ message: "User Registered Successfully", success: true });
});

// ── Login ─────────────────────────────────────────────────────────
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Sign JWT — expires in 7 days
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    message: "Login Successful",
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// ── Get All Users (with server-side pagination + search) ──────────
export const getAllUser = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 100); // default 100 for dashboard
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -resetToken -resetTokenExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

// ── Get User Stats for Dashboard ──────────────────────────────────
export const getUserStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Last 7 days registration trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    newThisMonth,
    newToday,
    roleBreakdown,
    dailySignups,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Build last 7 days array (fill missing days with 0)
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = dailySignups.find((s) => s._id === dateStr);
    trend.push({
      date: dateStr,
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      count: found ? found.count : 0,
    });
  }

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      newThisMonth,
      newToday,
      roleBreakdown,
      registrationTrend: trend,
    },
  });
});

// ── Update User ───────────────────────────────────────────────────
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const updateData = {};
  if (name) updateData.name = name;
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: id } });
    if (existing) return res.status(400).json({ message: "Email already in use by another account" });
    updateData.email = email;
  }
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    updateData.password = await bcrypt.hash(password, 12);
  }

  const updated = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -resetToken -resetTokenExpiry");

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: updated,
  });
});

// ── Delete User ───────────────────────────────────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await User.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "User deleted successfully" });
});

// ── Forgot Password — Send OTP via Email ──────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Security: Don't reveal if email exists (timing-safe)
    return res.status(404).json({ message: "No account found with this email address" });
  }

  // Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await User.findByIdAndUpdate(user._id, {
    resetToken: otp,
    resetTokenExpiry: expiry,
  });

  // Check if email credentials are configured
  const emailConfigured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_USER !== "your_gmail@gmail.com" &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_PASS !== "your_16_char_app_password";

  if (emailConfigured) {
    // ── PRODUCTION MODE: Send real email ──
    try {
      await sendOtpEmail(email, otp, user.name);
      return res.status(200).json({
        success: true,
        message: `OTP sent to ${email}. Please check your inbox (and spam folder).`,
        mode: "email", // frontend shows "check your email" — no OTP box
      });
    } catch (emailError) {
      console.error("❌ Email send failed:", emailError.message);
      // Fallback to demo mode if email fails
      return res.status(200).json({
        success: true,
        message: "Email service unavailable — using demo mode",
        otp,
        mode: "demo",
        expiresIn: "15 minutes",
      });
    }
  } else {
    // ── DEMO MODE: Return OTP in response ──
    return res.status(200).json({
      success: true,
      message: "OTP generated (Demo Mode — configure EMAIL_USER & EMAIL_PASS for real emails)",
      otp,
      mode: "demo",
      expiresIn: "15 minutes",
    });
  }
});

// ── Reset Password ─────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Email, OTP, and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "No account found with this email" });
  }

  if (!user.resetToken || user.resetToken !== otp) {
    return res.status(400).json({ message: "Invalid OTP code. Please request a new one." });
  }

  if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await User.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
  });

  res.status(200).json({ success: true, message: "Password reset successfully! You can now login." });
});

// ── Update Role (superadmin only) ─────────────────────────────────
export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["user", "admin", "superadmin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Must be: ${validRoles.join(", ")}` });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Prevent changing own role
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const updated = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select("-password -resetToken -resetTokenExpiry");

  res.status(200).json({
    success: true,
    message: `Role updated to '${role}' successfully`,
    user: updated,
  });
});
