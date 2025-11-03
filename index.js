import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";
import http from "http";

// Route imports
import authRoutes from "./src/routes/authRoutes.js";
import complaintRoutes from "./src/routes/complaintRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

// Middleware imports
import { notFound, errorHandler } from "./src/middlewares/errorMiddleware.js";
import connectDB from "./src/config/db.js";
import { Server } from "socket.io";
import { socketAuth } from "./src/middlewares/socketAuth.js";

dotenv.config();

const app = express();

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Create Socket.IO server
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
io.use(socketAuth);

const onlineUsers = new Map();

// ✅ Socket.IO Events
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("User Online:", userId);
  }

  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  socket.on("typing", (data) => {
    io.to(data.room).emit("typing", data);
  });

  socket.on("newMessage", (data) => {
    console.log("New message received:", data);
    io.to(data.room).emit("newMessage", data.message);
  });

  socket.on("disconnect", () => {
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
        console.log("User Offline:", key);
      }
    });

    console.log("Socket disconnected:", socket.id);
  });
});

// Routes
app.get("/", (req, res) => {
  res.send("Complaint Management System API is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

app.get("/api/test", (req, res) => {
  res.send("Proxy Working ✅");
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    // ✅ FIXED!
    console.log(`🌐 Server with socket.io running on port ${PORT}`);
  });
});
