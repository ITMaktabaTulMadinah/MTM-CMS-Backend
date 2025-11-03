import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 🧾 Register new user
router.post("/register", registerUser);

// 🔑 Login user
router.post("/login", loginUser);

// 👤 Get logged-in user profile
router.get("/profile", protect, getUserProfile);

export default router;
