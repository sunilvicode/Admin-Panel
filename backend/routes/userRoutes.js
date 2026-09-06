import express from "express";
import {
  registerUser,
  loginUser,
  getAllUser,
  getUserStats,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateRole,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateUserValidation,
  updateRoleValidation,
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

// ── Public routes (with validation) ───────────────────────────────
router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);

// ── Admin routes (login required) ─────────────────────────────────
router.get(
  "/",
  protect,
  authorizeRoles("admin", "superadmin"),
  getAllUser
);

// User stats for dashboard analytics
router.get(
  "/stats",
  protect,
  authorizeRoles("admin", "superadmin"),
  getUserStats
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superadmin"),
  updateUserValidation,
  updateUser
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("superadmin"),
  deleteUser
);

// ── Superadmin only — change roles ─────────────────────────────────
router.patch(
  "/:id/role",
  protect,
  authorizeRoles("superadmin"),
  updateRoleValidation,
  updateRole
);

export default router;