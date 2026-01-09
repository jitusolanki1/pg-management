/**
 * Lead Routes - Admin CRM for managing tenant applications
 * Protected routes - requires admin authentication
 */

import express from "express";
import mongoose from "mongoose";
import Lead from "../models/Lead.js";

const router = express.Router();

// GET /api/leads - Get all leads with filtering
router.get("/", async (req, res) => {
  try {
    const {
      status,
      occupation,
      roomPreference,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (occupation && occupation !== "all") {
      filter.occupation = occupation;
    }

    if (roomPreference && roomPreference !== "all") {
      filter.roomPreference = roomPreference;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lead.countDocuments(filter);

    // Fetch leads
    const leads = await Lead.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("processedBy", "name email");

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
});

// GET /api/leads/stats - Get lead statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform to object
    const statsObj = {
      pending: 0,
      contacted: 0,
      scheduled: 0,
      accepted: 0,
      rejected: 0,
      total: 0,
    };

    stats.forEach((s) => {
      statsObj[s._id] = s.count;
      statsObj.total += s.count;
    });

    // Get recent leads (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentCount = await Lead.countDocuments({
      createdAt: { $gte: weekAgo },
    });

    // Get today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await Lead.countDocuments({
      createdAt: { $gte: today },
    });

    res.json({
      success: true,
      data: {
        ...statsObj,
        recentLeads: recentCount,
        todayLeads: todayCount,
      },
    });
  } catch (error) {
    console.error("Get lead stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

// GET /api/leads/:id - Get single lead
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findById(id)
      .populate("processedBy", "name email")
      .populate("convertedToTenant", "name email roomNumber");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lead",
    });
  }
});

// POST /api/leads - Create new lead (from public registration - this will be called without auth)
router.post("/public", async (req, res) => {
  try {
    const {
      email,
      googleName,
      googleUid,
      fullName,
      phone,
      occupation,
      roomPreference,
      moveInDate,
      message,
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !fullName ||
      !phone ||
      !occupation ||
      !roomPreference ||
      !moveInDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check for duplicate (same email or phone within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingLead = await Lead.findOne({
      $or: [{ email }, { phone: phone.replace(/\D/g, "") }],
      createdAt: { $gte: thirtyDaysAgo },
      status: { $nin: ["rejected"] },
    });

    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: "An application with this email or phone already exists",
      });
    }

    const lead = await Lead.create({
      email,
      googleName,
      googleUid,
      fullName,
      phone: phone.replace(/\D/g, ""), // Store only digits
      occupation,
      roomPreference,
      moveInDate: new Date(moveInDate),
      message,
      status: "pending",
      source: "website",
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
});

// PUT /api/leads/:id - Update lead status/notes
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const { status, adminNotes, visitDate, contactedAt, scheduledAt } =
      req.body;

    const updateData = {};

    if (status) {
      updateData.status = status;

      // Set timestamps based on status change
      if (status === "contacted" && !contactedAt) {
        updateData.contactedAt = new Date();
      }
      if (status === "scheduled" && !scheduledAt) {
        updateData.scheduledAt = new Date();
      }
      if (status === "accepted" || status === "rejected") {
        updateData.processedAt = new Date();
        updateData.processedBy = req.admin._id;
      }
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (visitDate) {
      updateData.visitDate = new Date(visitDate);
    }

    if (contactedAt) {
      updateData.contactedAt = new Date(contactedAt);
    }

    if (scheduledAt) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    const lead = await Lead.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("processedBy", "name email");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead",
    });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
    });
  }
});

// POST /api/leads/:id/convert - Convert lead to tenant
router.post("/:id/convert", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const lead = await Lead.findByIdAndUpdate(
      id,
      {
        status: "accepted",
        convertedToTenant: tenantId,
        processedAt: new Date(),
        processedBy: req.admin._id,
      },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
      message: "Lead converted to tenant successfully",
    });
  } catch (error) {
    console.error("Convert lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to convert lead",
    });
  }
});

export default router;
