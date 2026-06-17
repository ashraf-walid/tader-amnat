import mongoose from "mongoose";

const EmployeeAvailabilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
EmployeeAvailabilitySchema.index({ isActive: 1, sortOrder: 1 });
EmployeeAvailabilitySchema.index({ sortOrder: 1 });

export default mongoose.models.EmployeeAvailability ||
  mongoose.model("EmployeeAvailability", EmployeeAvailabilitySchema);
