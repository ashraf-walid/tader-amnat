import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/attempts/consume
 * Consume one attempt for bill calculation.
 * Returns remaining attempts or error if none left.
 */
export async function POST(request) {
  try {
    const decoded = requireAuth(request);

    await connectToDatabase();

    const user = await User.findById(decoded.userId).select(
      "attempts username"
    );
    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (user.attempts <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لقد استنفدت جميع المحاولات المتاحة. يرجى الاتصال بالإدارة لتجديد المحاولات.",
          remainingAttempts: 0,
        },
        { status: 403 }
      );
    }

    // Decrement using findByIdAndUpdate to bypass bcrypt pre-save hook
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { attempts: -1 } },
      { new: true, select: "attempts username" }
    );

    return NextResponse.json({
      success: true,
      remainingAttempts: updated.attempts,
      message: `متبقي ${updated.attempts} محاولة`,
    });
  } catch (error) {
    console.error("POST /api/attempts/consume Error:", error);

    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء خصم المحاولة",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attempts/consume
 * Get current remaining attempts.
 */
export async function GET(request) {
  try {
    const decoded = requireAuth(request);

    await connectToDatabase();

    const user = await User.findById(decoded.userId).select("attempts");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      remainingAttempts: user.attempts,
    });
  } catch (error) {
    if (error.name === "AuthError") {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
