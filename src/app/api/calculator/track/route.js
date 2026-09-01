import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import CalculationLog from "@/models/CalculationLog";
import { requireAuth } from "@/lib/auth";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * POST /api/calculator/track
 * Tracks user calculation count and creates a CalculationLog entry
 * without consuming attempts.
 */
export async function POST(request) {
  try {
    const decoded = requireAuth(request);

    await connectToDatabase();

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select(
      "username calculationsCount role officeName"
    );
    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 },
      );
    }

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { calculationsCount: 1 } },
      { returnDocument: "after", select: "username calculationsCount role officeName" },
    );

    // Log this calculation for date-based reporting
    await CalculationLog.create({
      userId: user._id,
      username: updated.username,
      role: updated.role || "client",
      officeName: updated.officeName || "",
    });

    // Clear cache so admin dashboard reflects the updated calculation count
    invalidateCache("accounts:");

    return NextResponse.json({
      success: true,
      calculationsCount: updated.calculationsCount,
    });
  } catch (error) {
    console.error("POST /api/calculator/track Error:", error);

    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تسجيل عملية الحساب",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
