import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_DAYS = [1, 7, 30, 90];
const MAX_ROWS = 3000;

/**
 * GET /api/activity-log?days=7
 * Owner only. Returns the actions recorded in the last N days, newest first.
 */
export async function GET(request) {
  try {
    requireOwner(request);

    const requested = Number(new URL(request.url).searchParams.get("days"));
    const days = ALLOWED_DAYS.includes(requested) ? requested : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    await connectToDatabase();
    const logs = await ActivityLog.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(MAX_ROWS + 1)
      .lean();

    return NextResponse.json({
      success: true,
      days,
      truncated: logs.length > MAX_ROWS,
      logs: logs.slice(0, MAX_ROWS).map(({ _id, ...log }) => ({ id: String(_id), ...log })),
    });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ success: false, error: "Forbidden - Owner only" }, { status: 403 });
    }
    console.error("GET /api/activity-log Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
