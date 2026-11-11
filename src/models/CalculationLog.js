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
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fingerprint: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true },
);

// Index for fast date-based queries
CalculationLogSchema.index({ createdAt: -1 });
CalculationLogSchema.index({ userId: 1, createdAt: -1 });
CalculationLogSchema.index(
  { userId: 1, fingerprint: 1 },
  { unique: true, partialFilterExpression: { fingerprint: { $type: "string" } } },
);

export default mongoose.models.CalculationLog ||
  mongoose.model("CalculationLog", CalculationLogSchema);
