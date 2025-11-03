import mongoose from "mongoose";
import shortid from "shortid";

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    complaintId: {
      type: String,
      default: shortid.generate,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Please enter a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please enter complaint details"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: ["Hardware", "Software", "Network", "Other"],
      default: "Other",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    attachment: {
      type: String, // Cloudinary file URL
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin/staff id
    },
    resolvedAt: {
      type: Date,
      default: null, // Only set when status is Resolved
    },
    remarks: {
      type: String,
      default: "",
    },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
