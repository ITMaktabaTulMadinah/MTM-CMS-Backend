import jwt from "jsonwebtoken";
import User from "../models/User.js"; // ✅ Fixed correct path

export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.warn("⚠️ No token provided for socket connection");
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = {
      id: user._id,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("❌ Socket auth error:", error.message);
    next(new Error("Authentication error"));
  }
};
