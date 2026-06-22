import mongoose from "mongoose";

const CalculationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "employee", "client"],
      default: "client",
    },
    officeName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Index for fast date-based queries
CalculationLogSchema.index({ createdAt: -1 });
CalculationLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.CalculationLog ||
  mongoose.model("CalculationLog", CalculationLogSchema);
