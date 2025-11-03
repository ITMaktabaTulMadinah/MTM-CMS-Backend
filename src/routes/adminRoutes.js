import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  getComplaintsChartData,
  getAllComplaints,
  updateComplaintStatus,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 👥 Get all users
router.get("/users", protect, adminOnly, getAllUsers);

// 👤 Get single user
router.get("/users/:id", protect, adminOnly, getUserById);

// ✏️ Update user
router.put("/users/:id", protect, adminOnly, updateUser);

// 🗑️ Delete user
router.delete("/users/:id", protect, adminOnly, deleteUser);

// 📊 Get dashboard statistics
router.get("/stats", protect, adminOnly, getDashboardStats);

// 📈 Get complaints chart data
router.get("/chart-data", protect, adminOnly, getComplaintsChartData);

// 📋 Get all complaints
router.get("/complaints", protect, adminOnly, getAllComplaints);

// ✏️ Update complaint status
router.put("/complaints/:id/status", protect, adminOnly, updateComplaintStatus);

export default router;
