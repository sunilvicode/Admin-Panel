import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware to check validation results and return formatted response
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return res.status(400).json({
      success: false,
      message: errorList[0].msg,
      errors: errorList.map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/* ─── User Validation Rules ─────────────────────────────────────────── */

export const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
  validate,
];

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email address is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  validate,
];

export const resetPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("otp")
    .trim()
    .notEmpty().withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
    .isNumeric().withMessage("OTP must contain only numbers"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
];

export const updateUserValidation = [
  param("id")
    .isMongoId().withMessage("Invalid user ID format"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
];

export const updateRoleValidation = [
  param("id")
    .isMongoId().withMessage("Invalid user ID format"),
  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["user", "admin", "superadmin"]).withMessage("Role must be one of: user, admin, superadmin"),
  validate,
];

/* ─── Product Validation Rules ──────────────────────────────────────── */

export const createProductValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Product name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Product name must be between 2 and 100 characters"),
  body("price")
    .notEmpty().withMessage("Price is required")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("category")
    .notEmpty().withMessage("Category is required")
    .isIn(["Electronics", "Clothing", "Food", "Books", "Sports", "Home", "Beauty", "Other"])
    .withMessage("Invalid product category"),
  body("stock")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("imageUrl")
    .optional({ checkFalsy: true })
    .isURL().withMessage("Image URL must be a valid URL"),
  body("status")
    .optional()
    .isIn(["active", "inactive"]).withMessage("Status must be active or inactive"),
  validate,
];

export const updateProductValidation = [
  param("id")
    .isMongoId().withMessage("Invalid product ID format"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Product name must be between 2 and 100 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("category")
    .optional()
    .isIn(["Electronics", "Clothing", "Food", "Books", "Sports", "Home", "Beauty", "Other"])
    .withMessage("Invalid product category"),
  body("stock")
    .optional()
    .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("imageUrl")
    .optional({ checkFalsy: true })
    .isURL().withMessage("Image URL must be a valid URL"),
  body("status")
    .optional()
    .isIn(["active", "inactive"]).withMessage("Status must be active or inactive"),
  validate,
];
