import User from "../models/User.js";
import Complaint from "../models/Complaint.js";

// 👥 Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👤 Get single user
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;

    const updateData = { name, email, role, department };

    // ✅ Password sirf tab update ho jab diya gaya ho
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🗑️ Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow deleting the current admin
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({
      status: "Resolved",
    });
    const pendingComplaints = await Complaint.countDocuments({
      status: "Pending",
    });
    const inProgressComplaints = await Complaint.countDocuments({
      status: "In Progress",
    });

    // Complaints today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const complaintsToday = await Complaint.countDocuments({
      createdAt: { $gte: today },
    });

    // Complaints by status
    const statusStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Complaints by category
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Complaints by priority
    const priorityStats = await Complaint.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentComplaints = await Complaint.find({
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      inProgressComplaints,
      complaintsToday,
      statusStats,
      categoryStats,
      priorityStats,
      recentComplaints,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📈 Get complaints chart data
export const getComplaintsChartData = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const chartData = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get all complaints
export const getAllComplaints = async (req, res) => {
  try {
    const { status, category, priority } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update complaint status
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
