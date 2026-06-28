import mongoose from "mongoose";

const PageVisitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    username: {
      type: String,
      default: "",
    },
    page: {
      type: String,
      required: true,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Database Indexes For Optimized Performance ───────────────────────────
// 1️⃣ For fast upsert operations (finding by combination of userId and page)
PageVisitSchema.index({ userId: 1, page: 1 });

// 2️⃣ For querying page analytics (e.g. which pages are visited most)
PageVisitSchema.index({ page: 1 });

// 3️⃣ For sorting / querying logs chronologically
PageVisitSchema.index({ lastVisitedAt: -1 });

// 4️⃣ For administrative searches by username
PageVisitSchema.index({ username: 1 });

export default mongoose.models.PageVisit || mongoose.model("PageVisit", PageVisitSchema);
