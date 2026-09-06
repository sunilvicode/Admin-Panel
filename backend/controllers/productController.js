import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";

// ── GET /api/products — List with server-side pagination, search, filter ──
export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 8);
  const skip = (page - 1) * limit;

  const { search, category, status, sortBy = "createdAt", order = "desc" } = req.query;

  // Build filter
  const filter = {};
  if (category && category !== "All") filter.category = category;
  if (status && status !== "All") filter.status = status;
  if (search) {
    // Case-insensitive search on name or description
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Allowed sort fields (whitelist for security)
  const allowedSort = ["createdAt", "price", "stock", "name"];
  const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email"),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

// ── GET /api/products/stats — Dashboard stats ─────────────────────────────
export const getProductStats = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    categoryBreakdown,
    recentProducts,
    totalValueAgg,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: "active" }),
    Product.countDocuments({ stock: { $lte: 5, $gt: 0 } }),
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Product.find().sort({ createdAt: -1 }).limit(5).populate("createdBy", "name"),
    Product.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ["$price", "$stock"] } } } },
    ]),
  ]);

  const outOfStock = await Product.countDocuments({ stock: 0 });

  res.status(200).json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      lowStockProducts,
      outOfStock,
      totalInventoryValue: totalValueAgg[0]?.totalValue || 0,
      categoryBreakdown,
      recentProducts,
    },
  });
});

// ── POST /api/products — Create ───────────────────────────────────────────
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock, imageUrl, status } = req.body;

  if (!name || price === undefined || !category) {
    return res.status(400).json({ message: "Name, price, and category are required" });
  }

  const product = await Product.create({
    name,
    description: description || "",
    price,
    category,
    stock: stock || 0,
    imageUrl: imageUrl || "",
    status: status || "active",
    createdBy: req.user._id,
  });

  const populated = await product.populate("createdBy", "name email");

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: populated,
  });
});

// ── PUT /api/products/:id — Update ────────────────────────────────────────
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const { name, description, price, category, stock, imageUrl, status } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (category !== undefined) updateData.category = category;
  if (stock !== undefined) updateData.stock = stock;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (status !== undefined) updateData.status = status;

  const updated = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updated,
  });
});

// ── DELETE /api/products/:id — Delete (superadmin only) ──────────────────
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  await Product.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Product deleted successfully" });
});
