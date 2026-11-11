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
    const body = await request.json();
    const { inputs, result } = body || {};
    if (!inputs || typeof inputs !== "object" || !result || typeof result !== "object" ||
        !Number.isFinite(Number(result?.egp?.total)) || !Number.isFinite(Number(result?.usd?.subtotal))) {
      return NextResponse.json(
        { success: false, error: "بيانات الفاتورة غير مكتملة" },
        { status: 400 },
      );
    }

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

    // Store the calculation snapshot with the authenticated user's identity.
    await CalculationLog.create({
      userId: user._id,
      username: user.username,
      role: user.role || "client",
      officeName: user.officeName || "",
      inputs,
      result,
    });

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { calculationsCount: 1 } },
      { returnDocument: "after", select: "username calculationsCount role officeName" },
    );

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
