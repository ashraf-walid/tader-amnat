import mongoose from "mongoose";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/**
 * One row per sensitive action, written by the server when the action
 * succeeds. Read only by the owner through /api/activity-log.
 */
const ActivityLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, default: null },
    actorName: { type: String, required: true },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true },
    target: {
      kind: { type: String },
      id: { type: String },
      name: { type: String },
      accountCode: { type: String },
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivityLogSchema.index({ createdAt: -1 });
// Logs older than a year are removed automatically by MongoDB
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ONE_YEAR_SECONDS });

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);
