/**
 * Lead Model for Tenant Applications
 * Stores leads from public registration form
 */

import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    // From Google Auth
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    googleName: {
      type: String,
      trim: true,
    },
    googleUid: {
      type: String,
      trim: true,
    },

    // From Form
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    occupation: {
      type: String,
      enum: ["student", "working"],
      required: true,
    },
    roomPreference: {
      type: String,
      enum: ["single", "double", "triple"],
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },

    // Lead Status
    status: {
      type: String,
      enum: ["pending", "contacted", "scheduled", "accepted", "rejected"],
      default: "pending",
    },

    // Admin Notes
    adminNotes: {
      type: String,
      trim: true,
    },

    // Tracking
    source: {
      type: String,
      default: "website",
    },

    // Action Timestamps
    contactedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    visitDate: {
      type: Date,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // If converted to tenant
    convertedToTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ moveInDate: 1 });

// Virtual for days since submission
leadSchema.virtual("daysSinceSubmission").get(function () {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted phone
leadSchema.virtual("formattedPhone").get(function () {
  if (!this.phone) return "";
  const cleaned = this.phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return this.phone;
});

// Virtual for room preference label
leadSchema.virtual("roomPreferenceLabel").get(function () {
  const labels = {
    single: "Single Sharing",
    double: "Double Sharing",
    triple: "Triple Sharing",
  };
  return labels[this.roomPreference] || this.roomPreference;
});

// Ensure virtuals are included in JSON
leadSchema.set("toJSON", { virtuals: true });
leadSchema.set("toObject", { virtuals: true });

export default mongoose.model("Lead", leadSchema);
