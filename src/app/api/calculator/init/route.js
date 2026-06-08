import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/calculator/init
 * Returns remaining attempts for the authenticated user.
 * Exchange rate is fetched server-side in page.jsx (no flicker).
 */
export async function GET(request) {
  try {
    const decoded = requireAuth(request);
    const userId = decoded.userId || decoded.id;

    await connectToDatabase();

    const user = await User.findById(userId).select("attempts").lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      remainingAttempts: user.attempts,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 },
      );
    }
    console.error("GET /api/calculator/init Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
