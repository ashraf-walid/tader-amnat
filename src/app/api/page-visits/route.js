import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAuth, requireAdmin } from "@/lib/auth";
import PageVisit from "@/models/PageVisit";

export const dynamic = "force-dynamic";

// Owner and admin visits are testing, not real use, so they are not counted
const UNCOUNTED_ROLES = ["owner", "admin"];
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/page-visits
 * Records that the signed-in user opened a page.
 */
export async function POST(request) {
  try {
    const user = requireAuth(request);
    const role = String(user.role || "").toLowerCase();
    const { page } = await request.json();

    if (!page || typeof page !== "string" || !page.startsWith("/")) {
      return NextResponse.json({ success: false, error: "page is required" }, { status: 400 });
    }
    if (UNCOUNTED_ROLES.includes(role)) {
      return NextResponse.json({ success: true, counted: false });
    }

    await connectToDatabase();
    await PageVisit.findOneAndUpdate(
      { userId: user.userId || user.id, page },
      {
        $inc: { visitCount: 1 },
        $set: { lastVisitedAt: new Date(), username: user.username, role },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true, counted: true });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/page-visits Error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تسجيل الزيارة" }, { status: 500 });
  }
}

/**
 * GET /api/page-visits
 * One row per page: last visit, users in the last 7 and 30 days, total visits.
 * Rows saved before roles were stored are matched to their user's current role.
 */
export async function GET(request) {
  try {
    requireAdmin(request);
    await connectToDatabase();

    const now = Date.now();
    const pages = await PageVisit.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $addFields: { effectiveRole: { $ifNull: [{ $arrayElemAt: ["$user.role", 0] }, "$role"] } } },
      { $match: { userId: { $ne: null }, effectiveRole: { $nin: UNCOUNTED_ROLES } } },
      {
        $group: {
          _id: "$page",
          lastVisitedAt: { $max: "$lastVisitedAt" },
          totalVisits: { $sum: "$visitCount" },
          users7d: { $sum: { $cond: [{ $gte: ["$lastVisitedAt", new Date(now - 7 * DAY_MS)] }, 1, 0] } },
          users30d: { $sum: { $cond: [{ $gte: ["$lastVisitedAt", new Date(now - 30 * DAY_MS)] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      pages: pages.map(({ _id, ...p }) => ({ page: _id, ...p })),
    });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/page-visits Error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء جلب الزيارات" }, { status: 500 });
  }
}
