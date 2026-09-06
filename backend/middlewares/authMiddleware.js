import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ── Verify JWT token ──────────────────────────────────────────────
// Supports both:
//   Authorization: Bearer <token>   (industry standard)
//   Authorization: <token>          (legacy fallback)
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Extract token — support "Bearer <token>" and raw token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password -resetToken -resetTokenExpiry");

    if (!user) {
      return res.status(401).json({ message: "User not found, token invalid" });
    }

    req.user = user; // attach user (with role) to request
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

// ── Role-based authorization ───────────────────────────────────────
// Usage: authorizeRoles("superadmin")
//        authorizeRoles("admin", "superadmin")
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required: ${roles.join(" or ")}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};
