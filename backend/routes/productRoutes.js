import express from "express";
import {
  getProducts,
  getProductStats,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";
import {
  createProductValidation,
  updateProductValidation,
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

// ── Stats (admin+) ────────────────────────────────────────────────
router.get(
  "/stats",
  protect,
  authorizeRoles("admin", "superadmin"),
  getProductStats
);

// ── List products (admin+) ─────────────────────────────────────────
router.get(
  "/",
  protect,
  authorizeRoles("admin", "superadmin"),
  getProducts
);

// ── Create product (admin+) ────────────────────────────────────────
router.post(
  "/",
  protect,
  authorizeRoles("admin", "superadmin"),
  createProductValidation,
  createProduct
);

// ── Update product (admin+) ────────────────────────────────────────
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "superadmin"),
  updateProductValidation,
  updateProduct
);

// ── Delete product (superadmin only) ──────────────────────────────
router.delete(
  "/:id",
  protect,
  authorizeRoles("superadmin"),
  deleteProduct
);

export default router;
