import { io } from "../../index.js";
import cloudinary from "../config/cloudinary.js";
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

// 📝 Create a new complaint
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, attachment } = req.body;

    let attachmentUrl = null;

    // Agar attachment base64 format me aa raha hai (frontend se)
    if (attachment) {
      const uploadedResponse = await cloudinary.uploader.upload(attachment, {
        folder: "complaints_attachments", // optional folder name
        resource_type: "auto", // auto detect image/pdf/video etc
      });
      attachmentUrl = uploadedResponse.secure_url;
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      title,
      description,
      category,
      priority,
      attachment: attachmentUrl,
    });

    const populatedComplaint = await Complaint.findById(complaint._id).populate(
      "user",
      "name email department"
    );

    res.status(201).json(populatedComplaint);
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get all complaints (Admin only)
export const getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("user", "name email department")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get user's own complaints
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get single complaint
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email department")
      .populate("assignedTo", "name email")
      .populate("messages.sender", "name");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if user can access this complaint
    if (
      req.user.role !== "admin" &&
      complaint.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update complaint (Admin only)
export const updateComplaint = async (req, res) => {
  try {
    const { status, assignedTo, remarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (remarks) updateData.remarks = remarks;

    // Set resolvedAt if status is Resolved
    if (status === "Resolved") {
      updateData.resolvedAt = new Date();
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("user", "name email department")
      .populate("assignedTo", "name email");

    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete complaint (Admin only)
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMessageToComplaint = async (req, res) => {
  try {
    const { message } = req.body;
    const complaintId = req.params.id;

    if (!message) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const newMessage = {
      sender: req.user._id,
      text: message, // ✅ correct
      createdAt: new Date(),
    };

    complaint.messages.push(newMessage);
    await complaint.save();

    return res.json({ message: newMessage });
  } catch (err) {
    console.error("Chat message API error", err);
    return res.status(500).json({ error: "Server error" });
  }
};
