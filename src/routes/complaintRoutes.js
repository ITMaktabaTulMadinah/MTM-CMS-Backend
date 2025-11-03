import express from "express";
import {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  addMessageToComplaint,
} from "../controllers/complaintController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📝 Create a new complaint
router.post("/", protect, createComplaint);

// 📋 Get all complaints (Admin only)
router.get("/", protect, adminOnly, getAllComplaints);

// 📋 Get user's own complaints
router.get("/my", protect, getMyComplaints);

// 🔍 Get single complaint
router.get("/:id", protect, getComplaintById);

// ✏️ Update complaint (Admin only)
router.put("/:id", protect, adminOnly, updateComplaint);

// 🗑️ Delete complaint (Admin only)
router.delete("/:id", protect, adminOnly, deleteComplaint);

router.post("/:id/message", protect, addMessageToComplaint);

export default router;
